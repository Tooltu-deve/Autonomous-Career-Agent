/**
 * Local types for the profile-setup wizard.
 * These are UI-layer types — separate from the API types in @/types/api.ts.
 */
import type { TemplateName } from "@/types/api";
import type { EducationItem as EducationEntry } from "../_components/EducationForm";
import type { ExperienceItem as ExperienceEntry } from "../_components/ExperienceForm";

export type { EducationEntry, ExperienceEntry };

/** Tầng UI giữ month/year TÁCH RỜI, không giữ chuỗi ISO — nếu gộp thì chọn
 * tháng khi chưa có năm sẽ bị mất (join trả rỗng). Ghép sang ISO chỉ ở
 * toProfileUpdate(), tách từ ISO chỉ khi nạp dữ liệu từ server. */
export interface CertificationEntry {
  id: number | string;
  title: string;
  month: string;
  year: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  summary: string;
  preferred_template: TemplateName;
  education: EducationEntry[];
  skills: string[];
  experiences: ExperienceEntry[];
  /** Wizard sửa certifications ở step 2: lưu tách month/year riêng, chỉ
   * ghép thành chuỗi ISO (obtain_date) trong toProfileUpdate() trước khi gửi. */
  certifications: CertificationEntry[];
}
