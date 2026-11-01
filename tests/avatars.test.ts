import test from "node:test";
import assert from "node:assert/strict";
import { GAME_AVATARS, getAvatarInfo } from "../src/lib/avatars";

test("avatars: provides 8 distinct mascots with valid properties", () => {
  assert.equal(GAME_AVATARS.length, 8);
  const ids = new Set(GAME_AVATARS.map((a) => a.id));
  assert.equal(ids.size, 8);

  for (const av of GAME_AVATARS) {
    assert.ok(av.id);
    assert.ok(av.name);
    assert.ok(av.emoji);
    assert.ok(av.color);
  }
});

test("avatars: getAvatarInfo returns mascot or fallback to default", () => {
  const fox = getAvatarInfo("fox");
  assert.equal(fox.name, "Cáo thông thái");
  assert.equal(fox.emoji, "🦊");

  const dragon = getAvatarInfo("dragon");
  assert.equal(dragon.name, "Rồng lửa");
  assert.equal(dragon.emoji, "🐲");

  const fallback = getAvatarInfo("unknown_xyz");
  assert.equal(fallback.id, "fox");
});
