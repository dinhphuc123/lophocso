import test from "node:test";
import assert from "node:assert/strict";
import {
  MemoryRoomAdapter,
  UpstashRoomAdapter,
  getGameRoomAdapter,
} from "../src/lib/redis-adapter";
import { GameRoom, viewRoom } from "../src/lib/game-store";

function makeDummyRoom(pin: string): GameRoom {
  return {
    pin,
    examId: "exam-test",
    examTitle: "Đề kiểm tra thử",
    mode: "arena",
    state: "lobby",
    currentQuestionIndex: 0,
    totalQuestions: 5,
    bossHp: 1000,
    maxBossHp: 1000,
    timeLimitSec: 30,
    questionStartedAt: 0,
    players: {},
    questions: [],
    createdAt: Date.now(),
  };
}

test("redis-adapter: MemoryRoomAdapter save, get, delete, pub/sub", async () => {
  const adapter = new MemoryRoomAdapter();
  const room = makeDummyRoom("999111");

  await adapter.save(room);
  const fetched = await adapter.get("999111");
  assert.equal(fetched?.pin, "999111");
  assert.equal(fetched?.examTitle, "Đề kiểm tra thử");

  let receivedPin = "";
  const unsub = adapter.subscribe("999111", (v) => {
    receivedPin = v.pin;
  });

  await adapter.publish("999111", viewRoom(room));
  assert.equal(receivedPin, "999111");

  unsub();
  await adapter.delete("999111");
  const afterDel = await adapter.get("999111");
  assert.equal(afterDel, undefined);
});

test("redis-adapter: UpstashRoomAdapter fallbacks gracefully without network", async () => {
  const badAdapter = new UpstashRoomAdapter("https://dummy.upstash.io", "bad-token");
  const room = makeDummyRoom("888222");

  // Should gracefully handle failure without crashing
  await badAdapter.save(room);
  const fetched = await badAdapter.get("888222");
  // Since network call fails, it falls back to memory store
  assert.equal(fetched?.pin, "888222");
});

test("redis-adapter: getGameRoomAdapter returns an active instance", () => {
  const instance = getGameRoomAdapter();
  assert.ok(instance);
  assert.ok(instance.name === "memory" || instance.name === "redis-rest" || instance.name === "redis-tcp");
});
