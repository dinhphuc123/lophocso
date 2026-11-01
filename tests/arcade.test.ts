import test from "node:test";
import assert from "node:assert/strict";
import { ARCADE_GAMES, ARCADE_CATEGORIES } from "../src/lib/arcade-catalog";

test("arcade: catalog includes all 12 educational games including THPT math", () => {
  assert.equal(ARCADE_GAMES.length, 12);
  assert.ok(ARCADE_CATEGORIES.includes("Toán THPT"));

  const expectedIds = [
    "doan-do-thi",
    "vong-tron-luong-giac",
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
  assert.equal(thptGames.length, 2);
  assert.ok(thptGames.some((g) => g.id === "doan-do-thi" && g.gradeMin >= 10));
  assert.ok(thptGames.some((g) => g.id === "vong-tron-luong-giac" && g.gradeMin >= 10));
});
