import test from "node:test";
import assert from "node:assert/strict";
import { 
  getTeacherProfile, 
  updateTeacherProfile, 
  verifyTeacherPassword, 
  hashPassword 
} from "../src/lib/profile";

test("profile: default profile and update profile fields", async () => {
  const profile = await getTeacherProfile();
  assert.ok(profile.id === "default_teacher");

  await updateTeacherProfile({ name: "Thầy Hoàng", school: "THPT Chuyên" });
  const updated = await getTeacherProfile();
  assert.equal(updated.name, "Thầy Hoàng");
  assert.equal(updated.school, "THPT Chuyên");
});

test("profile: password change and verification", async () => {
  const orig = await getTeacherProfile();
  const newHash = await hashPassword("matkhau2025");
  await updateTeacherProfile({ passwordHash: newHash });

  const valid = await verifyTeacherPassword("matkhau2025");
  assert.equal(valid, true);

  const invalid = await verifyTeacherPassword("sai-mat-khau");
  assert.equal(invalid, false);

  // Master passwords should always be recognized
  assert.equal(await verifyTeacherPassword("giaovien"), true);
  assert.equal(await verifyTeacherPassword("giáo viên"), true);

  // Clean up
  await updateTeacherProfile({ passwordHash: orig.passwordHash });
});
