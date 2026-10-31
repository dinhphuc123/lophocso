import { EventEmitter } from "node:events";
import { Exam, PublicQuestion, Question } from "./types";
import { getExamById } from "./db";
import { toPublicQuestion } from "./sanitize";
import { matchShort } from "./grader";
import { getGameRoomAdapter } from "./redis-adapter";

export type GameMode = "arena" | "bomb" | "farm" | "race" | "golden_bell" | "dance";
export type RoomState = "lobby" | "question" | "reveal" | "ended";

export const BOMB_LIVES = 3;
const MAX_PLAYERS = 150;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const TIME_LIMIT: Record<GameMode, number> = { 
  arena: 30, 
  bomb: 15, 
  farm: 40,
  race: 20,         // Đường đua tri thức: Tốc độ cao
  golden_bell: 25,  // Rung chuông vàng: Quyết đấu loại trừ
  dance: 15         // Vũ điệu tri thức: Nhịp điệu combo
};

export interface GamePlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
  lives: number;
  crops: number;
  lastAnswer?: { questionIndex: number; isCorrect: boolean; earnedScore: number };
}

export interface GameRoom {
  pin: string;
  examId: string;
  examTitle: string;
  mode: GameMode;
  state: RoomState;
  currentQuestionIndex: number;
  totalQuestions: number;
  bossHp: number;
  maxBossHp: number;
  timeLimitSec: number;
  questionStartedAt: number;
  players: Record<string, GamePlayer>;
  questions: Question[];
  winner?: "class" | "boss";
  createdAt: number;
}

export interface PlayerView extends Pick<GamePlayer, "id" | "name" | "score" | "streak" | "lives" | "crops"> {
  answered: boolean;
  lastCorrect?: boolean;
  lastEarned?: number;
}

/** What clients receive: current question without answer key; the answer only appears at reveal. */
export interface RoomView {
  pin: string;
  examTitle: string;
  mode: GameMode;
  state: RoomState;
  currentQuestionIndex: number;
  totalQuestions: number;
  bossHp: number;
  maxBossHp: number;
  timeLimitSec: number;
  remainingMs: number;
  serverNow: number;
  question: PublicQuestion | null;
  correct?: unknown;
  explanation?: string;
  players: PlayerView[];
  farmCrops: number;
  winner?: "class" | "boss";
}

// shortcut: pluggable store adapter (in-memory default, Redis TCP or Upstash REST when scaling).
const adapter = getGameRoomAdapter();

/** Calls cb with a fresh view whenever the room changes; returns the unsubscribe function. */
export function subscribeRoom(pin: string, cb: (view: RoomView) => void): () => void {
  return adapter.subscribe(pin, cb);
}

const notify = async (room: GameRoom) => {
  await adapter.save(room);
  await adapter.publish(room.pin, viewRoom(room));
};

async function generatePin(): Promise<string> {
  let pin: string;
  let exists = false;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await adapter.get(pin);
    exists = !!existing;
  } while (exists);
  return pin;
}

/** Pure builder (no registration) so scoring can be tested without the database. */
export function createRoomFromExam(exam: Exam, mode: GameMode): GameRoom {
  // essays cannot be auto-played on a phone
  const questions = exam.questions.filter((q) => q.type !== "essay");
  if (questions.length === 0) throw new Error("Đề không có câu nào chơi game được (chỉ có tự luận)");
  const maxBossHp = Math.max(500, questions.length * 150);
  return {
    pin: "",
    examId: exam.id,
    examTitle: exam.title,
    mode,
    state: "lobby",
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    bossHp: maxBossHp,
    maxBossHp,
    timeLimitSec: TIME_LIMIT[mode],
    questionStartedAt: 0,
    players: {},
    questions,
    createdAt: Date.now(),
  };
}

export async function createGameRoom(examId: string, mode: GameMode): Promise<GameRoom> {
  const exam = getExamById(examId);
  if (!exam) throw new Error("Không tìm thấy đề thi");
  const room = createRoomFromExam(exam, mode);
  room.pin = await generatePin();
  await adapter.save(room);
  return room;
}

const activePlayers = (room: GameRoom) =>
  Object.values(room.players).filter((p) => (room.mode !== "bomb" && room.mode !== "golden_bell") || p.lives > 0);

const hasAnswered = (room: GameRoom, p: GamePlayer) => p.lastAnswer?.questionIndex === room.currentQuestionIndex;

function reveal(room: GameRoom) {
  room.state = "reveal";
  if (room.mode === "bomb") {
    // the bomb explodes for everyone who did not answer correctly in time
    for (const p of activePlayers(room)) {
      if (!(hasAnswered(room, p) && p.lastAnswer?.isCorrect)) p.lives = Math.max(0, p.lives - 1);
    }
  } else if (room.mode === "golden_bell") {
    // Rung chuông vàng: Sai 1 câu là loại trực tiếp (lives = 0)
    for (const p of activePlayers(room)) {
      if (!(hasAnswered(room, p) && p.lastAnswer?.isCorrect)) p.lives = 0;
    }
  }
}

/** Lazy clock: close the question when time is up or every active player answered. */
function tick(room: GameRoom): boolean {
  if (room.state !== "question") return false;
  const timeUp = Date.now() - room.questionStartedAt >= room.timeLimitSec * 1000;
  const active = activePlayers(room);
  const allIn = active.length > 0 && active.every((p) => hasAnswered(room, p));
  if (!timeUp && !allIn) return false;
  reveal(room);
  return true;
}

export async function getGameRoom(pin: string): Promise<GameRoom | undefined> {
  const room = await adapter.get(pin);
  if (room && tick(room)) await notify(room);
  return room;
}

/** Called once a second by every open event stream so timers expire without a request. */
export async function tickRoom(pin: string): Promise<void> {
  await getGameRoom(pin);
}

export function viewRoom(room: GameRoom): RoomView {
  const q = room.questions[room.currentQuestionIndex];
  const inPlay = room.state === "question" || room.state === "reveal";
  const players = Object.values(room.players)
    .map<PlayerView>((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      streak: p.streak,
      lives: p.lives,
      crops: p.crops,
      answered: hasAnswered(room, p),
      lastCorrect: hasAnswered(room, p) ? p.lastAnswer?.isCorrect : undefined,
      lastEarned: hasAnswered(room, p) ? p.lastAnswer?.earnedScore : undefined,
    }))
    .sort((a, b) => b.score - a.score);

  let correct: unknown;
  if (room.state === "reveal" && q) {
    correct =
      q.type === "multiple_choice"
        ? q.correctAnswer
        : q.type === "true_false"
        ? Object.fromEntries(q.subQuestions.map((s) => [s.id, s.isCorrect]))
        : q.type === "short_answer"
        ? q.correctAnswers.join(" hoặc ")
        : undefined;
  }

  return {
    pin: room.pin,
    examTitle: room.examTitle,
    mode: room.mode,
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.totalQuestions,
    bossHp: room.bossHp,
    maxBossHp: room.maxBossHp,
    timeLimitSec: room.timeLimitSec,
    remainingMs: room.state === "question" ? Math.max(0, room.timeLimitSec * 1000 - (Date.now() - room.questionStartedAt)) : 0,
    serverNow: Date.now(),
    question: inPlay && q ? toPublicQuestion(q) : null,
    correct,
    explanation: room.state === "reveal" ? q?.explanation : undefined,
    players,
    farmCrops: players.reduce((a, p) => a + p.crops, 0),
    winner: room.winner,
  };
}

export async function joinGameRoom(pin: string, playerName: string, existingId?: string): Promise<{ player: GamePlayer; room: GameRoom }> {
  const room = await getGameRoom(pin);
  if (!room || room.state === "ended") throw new Error("Phòng thi không tồn tại hoặc đã kết thúc");

  // a refresh / reconnect keeps the same player instead of creating a duplicate
  if (existingId && room.players[existingId]) return { player: room.players[existingId], room };

  if (Object.keys(room.players).length >= MAX_PLAYERS) throw new Error("Phòng đã đầy");
  const base = playerName.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 30) || `Học sinh ${Object.keys(room.players).length + 1}`;
  const taken = new Set(Object.values(room.players).map((p) => p.name));
  let name = base;
  for (let i = 2; taken.has(name); i++) name = `${base} (${i})`;

  const player: GamePlayer = {
    id: `p_${Math.random().toString(36).slice(2, 10)}`,
    name,
    score: 0,
    streak: 0,
    lives: BOMB_LIVES,
    crops: 0,
  };
  room.players[player.id] = player;
  await notify(room);
  return { player, room };
}

/** Fraction of the question answered correctly: 1 = fully right. True/false gives partial credit per statement. */
function correctness(q: Question, answer: unknown): number {
  if (q.type === "multiple_choice") return answer === q.correctAnswer ? 1 : 0;
  if (q.type === "short_answer") return matchShort(answer, q.correctAnswers) ? 1 : 0;
  if (q.type === "true_false") {
    const given = (answer && typeof answer === "object" ? answer : {}) as Record<string, unknown>;
    const right = q.subQuestions.filter((s) => given[s.id] === s.isCorrect).length;
    return q.subQuestions.length ? right / q.subQuestions.length : 0;
  }
  return 0;
}

export async function submitPlayerAnswer(pin: string, playerId: string, questionIndex: number, answer: unknown) {
  const room = await getGameRoom(pin);
  if (!room) throw new Error("Phòng không tồn tại");
  const player = room.players[playerId];
  if (!player) throw new Error("Người chơi không tồn tại");
  if (room.state !== "question" || questionIndex !== room.currentQuestionIndex) throw new Error("Câu hỏi này đã đóng");
  if ((room.mode === "bomb" || room.mode === "golden_bell") && player.lives <= 0) throw new Error("Em đã bị loại");
  if (hasAnswered(room, player)) throw new Error("Em đã trả lời câu này rồi");

  const q = room.questions[questionIndex];
  const fraction = correctness(q, answer);
  const isCorrect = fraction === 1;
  const elapsed = Date.now() - room.questionStartedAt;
  const remainingRatio = Math.min(Math.max(1 - elapsed / (room.timeLimitSec * 1000), 0), 1);

  let earnedScore: number;
  if (isCorrect) {
    player.streak += 1;
    // Đường đua tri thức & Vũ điệu tri thức có hệ số nhân tốc độ/combo cao hơn
    const speedWeight = room.mode === "race" ? 150 : 100;
    const streakBonus = room.mode === "dance" ? Math.min(player.streak * 20, 100) : Math.min((player.streak - 1) * 10, 50);
    earnedScore = 100 + Math.round(speedWeight * remainingRatio) + streakBonus;
  } else {
    player.streak = 0;
    earnedScore = Math.round(100 * fraction);
  }
  player.score += earnedScore;
  if (room.mode === "arena") room.bossHp = Math.max(0, room.bossHp - earnedScore);
  if (room.mode === "farm" && isCorrect) player.crops += 1;
  player.lastAnswer = { questionIndex, isCorrect, earnedScore };

  tick(room);
  await notify(room);
  return { isCorrect, earnedScore, room };
}

export async function updateRoomControl(pin: string, action: "start" | "next" | "reveal" | "end"): Promise<GameRoom> {
  const room = await getGameRoom(pin);
  if (!room) throw new Error("Phòng không tồn tại");
  const begin = (index: number) => {
    room.currentQuestionIndex = index;
    room.state = "question";
    room.questionStartedAt = Date.now();
  };

  if (action === "start") {
    if (room.state !== "lobby") throw new Error("Trận đấu đã bắt đầu");
    if (Object.keys(room.players).length === 0) throw new Error("Chưa có học sinh nào vào phòng");
    begin(0);
  } else if (action === "reveal") {
    if (room.state !== "question") throw new Error("Chưa có câu hỏi đang mở");
    reveal(room);
  } else if (action === "next") {
    if (room.state !== "reveal") throw new Error("Hãy hiện đáp án trước khi sang câu tiếp");
    const bossDown = room.mode === "arena" && room.bossHp <= 0;
    const allOut = (room.mode === "bomb" || room.mode === "golden_bell") && activePlayers(room).length === 0;
    if (!bossDown && !allOut && room.currentQuestionIndex + 1 < room.totalQuestions) begin(room.currentQuestionIndex + 1);
    else room.state = "ended";
  } else {
    room.state = "ended";
  }

  if (room.state === "ended" && room.mode === "arena") room.winner = room.bossHp <= 0 ? "class" : "boss";
  await notify(room);
  return room;
}
