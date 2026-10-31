import test from "node:test";
import assert from "node:assert/strict";
import { createToken, verifyToken, checkPassword } from "../src/lib/auth";

test("auth: createToken produces a verifiable token and rejects tampering or bad password", async () => {
  const token = await createToken();
  assert.ok(token.length > 20);

  const valid = await verifyToken(token);
  assert.equal(valid, true);

  const tampered = token.slice(0, -3) + "xyz";
  assert.equal(await verifyToken(tampered), false);
  assert.equal(await verifyToken(""), false);
  assert.equal(await verifyToken("invalid.token"), false);

  assert.equal(checkPassword("wrong-pw"), false);
});
