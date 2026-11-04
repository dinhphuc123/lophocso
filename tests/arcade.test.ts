import test from "node:test";
import assert from "node:assert/strict";
import { ARCADE_GAMES, ARCADE_CATEGORIES } from "../src/lib/arcade-catalog";
import { CYBER_GATES_PACKS, getCyberGatesPresetExam, getCyberGateStageMeta } from "../src/lib/cyber-gates-presets";
import { createGameRoom, joinGameRoom, submitPlayerAnswer, updateRoomControl } from "../src/lib/game-store";

test("arcade: catalog includes all 15 educational games including 5 THPT math games", () => {
  assert.equal(ARCADE_GAMES.length, 15);
  assert.ok(ARCADE_CATEGORIES.includes("Toán THPT"));

  const expectedIds = [
    "doan-do-thi",
    "vong-tron-luong-giac",
    "vecto-oxyz",
    "dao-ham-nguyen-ham",
    "mat-vu-toan-hoc",
    "o-an-quan",
    "ghep-chu",
    "lat-the",
    "phan-so",
    "duoi-hinh",
    "duong-ve-nha",
    "nhac-viet",
    "phan-loai",
    "sudoku",
    "mat-ma",
  ];

  for (const id of expectedIds) {
    const game = ARCADE_GAMES.find((g) => g.id === id);
    assert.ok(game, `Missing game with id: ${id}`);
    assert.ok(game.title.length > 0);
    assert.ok(game.instructions.length > 0);
    assert.ok(game.objective.length > 0);
    assert.ok(game.minutes > 0);
    assert.ok(ARCADE_CATEGORIES.includes(game.category as any));
  }

  // Verify THPT specific games
  const thptGames = ARCADE_GAMES.filter((g) => g.category === "Toán THPT");
  assert.equal(thptGames.length, 5);
  assert.ok(thptGames.some((g) => g.id === "doan-do-thi" && g.gradeMin >= 10));
  assert.ok(thptGames.some((g) => g.id === "vong-tron-luong-giac" && g.gradeMin >= 10));
  assert.ok(thptGames.some((g) => g.id === "vecto-oxyz" && g.gradeMin >= 10));
  assert.ok(thptGames.some((g) => g.id === "dao-ham-nguyen-ham" && g.gradeMin >= 11));
  assert.ok(thptGames.some((g) => g.id === "mat-vu-toan-hoc" && g.gradeMin >= 10));
});

test("cyber_gates: 3 preset THPT packs have 5 stages, clues, and work in multiplayer PIN mode", async () => {
  assert.equal(CYBER_GATES_PACKS.length, 3);
  for (const pack of CYBER_GATES_PACKS) {
    assert.equal(pack.exam.questions.length, 5);
    assert.equal(pack.stages.length, 5);
    assert.ok(getCyberGatesPresetExam(pack.exam.id));
    for (let i = 0; i < 5; i++) {
      const meta = getCyberGateStageMeta(pack.exam.id, i);
      assert.equal(meta.stageNumber, i + 1);
      assert.ok(meta.clueText.length > 10);
      assert.ok(meta.ruleCode.length > 5);
    }
  }

  // Create live PIN room in cyber_gates mode using preset pack 1
  const presetId = CYBER_GATES_PACKS[0].exam.id;
  const room = await createGameRoom(presetId, "cyber_gates");
  assert.equal(room.mode, "cyber_gates");
  assert.equal(room.totalQuestions, 5);
  assert.equal(room.timeLimitSec, 45);

  const joined = await joinGameRoom(room.pin, "Thám Tử Minh Khôi", "fox");
  await updateRoomControl(room.pin, "start");

  // Answer stage 1 correctly (correctAnswer is "A")
  const ansRes = await submitPlayerAnswer(room.pin, joined.player.id, 0, "A");
  assert.equal(ansRes.isCorrect, true);
  assert.equal(ansRes.room.players[joined.player.id].crops, 1); // 1 Shield Piece unlocked
});
