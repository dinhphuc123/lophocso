import test from "node:test";
import assert from "node:assert/strict";
import { ARCADE_GAMES, ARCADE_CATEGORIES } from "../src/lib/arcade-catalog";

test("arcade: catalog includes all 10 educational games with complete metadata", () => {
  assert.equal(ARCADE_GAMES.length, 10);

  const expectedIds = [
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
});
