import test from "node:test";
import assert from "node:assert/strict";
import { parseStudentListFromFile } from "../src/lib/excel-parser";

test("excel-parser: parses CSV with 'Họ và tên' column", async () => {
  const csvContent = `STT,Họ và tên,Ngày sinh,Điểm
1,Nguyễn Văn An,12/03/2007,8.5
2,Trần Thị Bích,05/09/2007,9.0
3,Lê Hoàng Nam,20/11/2007,7.0
`;
  const file = new File([csvContent], "danh_sach_12A1.csv", { type: "text/csv" });
  const names = await parseStudentListFromFile(file);

  assert.equal(names.length, 3);
  assert.equal(names[0], "Nguyễn Văn An");
  assert.equal(names[1], "Trần Thị Bích");
  assert.equal(names[2], "Lê Hoàng Nam");
});

test("excel-parser: parses CSV with separate 'Họ đệm' and 'Tên' columns", async () => {
  const csvContent = `STT,Họ và tên đệm,Tên,Giới tính
1,Phạm Minh,Châu,Nữ
2,Hoàng Quốc,Việt,Nam
3,Đỗ Thị,Mai,Nữ
`;
  const file = new File([csvContent], "lop_11B2.csv", { type: "text/csv" });
  const names = await parseStudentListFromFile(file);

  assert.equal(names.length, 3);
  assert.equal(names[0], "Phạm Minh Châu");
  assert.equal(names[1], "Hoàng Quốc Việt");
  assert.equal(names[2], "Đỗ Thị Mai");
});

test("excel-parser: ignores empty lines, headers and invalid rows", async () => {
  const csvContent = `BẢNG ĐIỂM HỌC KỲ
Lớp 12A3
STT,Họ và tên,Ghi chú
1,Vũ Hải Đăng,Đoàn viên
2,Bùi Phương Thảo,
Tổng số: 2 học sinh
`;
  const file = new File([csvContent], "lop_12A3.csv", { type: "text/csv" });
  const names = await parseStudentListFromFile(file);

  assert.equal(names.length, 2);
  assert.equal(names[0], "Vũ Hải Đăng");
  assert.equal(names[1], "Bùi Phương Thảo");
});
