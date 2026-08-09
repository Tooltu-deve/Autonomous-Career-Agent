/** Hằng số dùng chung cho mọi ô chọn tháng/năm: chứng chỉ, kinh nghiệm, học vấn.
 * Tách khỏi CertificationsForm để không phải nhân bản danh sách tháng. */

export const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/** Số năm tương lai mở cho ô "To year" của học vấn: sinh viên đang học khai năm
 * tốt nghiệp dự kiến. 6 năm phủ được cả chương trình dài nhất (y khoa, tiến sĩ). */
export const FUTURE_GRADUATION_YEARS = 6;

/** Danh sách năm cho ô chọn, mới nhất trước.
 *
 * @param futureYears số năm tính từ năm hiện tại trở đi được phép chọn. Mặc
 *   định 0 — mốc đã xảy ra (ngày cấp chứng chỉ, ngày bắt đầu, ngày kết thúc
 *   công việc) không thể nằm ở tương lai. Học vấn truyền
 *   `FUTURE_GRADUATION_YEARS` cho ô kết thúc.
 */
export function yearOptions(futureYears = 0): string[] {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let y = now + futureYears; y >= 1970; y--) years.push(String(y));
  return years;
}
