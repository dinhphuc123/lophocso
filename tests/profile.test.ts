import test from "node:test";
import assert from "node:assert/strict";
import { 
  getTeacherProfile, 
  updateTeacherProfile, 
  verifyTeacherPassword, 
  hasCustomPassword,
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

test("profile: password change locks default giaovien and verifies custom password", async () => {
  const orig = await getTeacherProfile();

  // Clear custom password first: default "giaovien" and "giáo viên" must work
  await updateTeacherProfile({ passwordHash: undefined });
  assert.equal(await hasCustomPassword(), false);
  assert.equal(await verifyTeacherPassword("giaovien"), true);
  assert.equal(await verifyTeacherPassword("giáo viên"), true);

  // Set custom password: new password works, default "giaovien" is locked
  const newHash = await hashPassword("matkhau2025");
  await updateTeacherProfile({ passwordHash: newHash });
  assert.equal(await hasCustomPassword(), true);
  assert.equal(await verifyTeacherPassword("matkhau2025"), true);
  assert.equal(await verifyTeacherPassword("sai-mat-khau"), false);
  assert.equal(await verifyTeacherPassword("giaovien"), false);
  assert.equal(await verifyTeacherPassword("giáo viên"), false);

  // Restore original state
  await updateTeacherProfile({ passwordHash: orig.passwordHash });
});
