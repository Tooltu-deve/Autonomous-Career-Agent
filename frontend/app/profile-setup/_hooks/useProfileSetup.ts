"use client";

/**
 * useProfileSetup — custom hook chứa toàn bộ state và logic của wizard.
 * Components chỉ cần destructure giá trị/handler cần thiết từ hook này.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getPreferences,
  getProfile,
  getToken,
  putProfile,
} from "@/lib/api";
import type { ProfileUpdate } from "@/types/api";
import type { ProfileData } from "../_types/types";
import type { EducationField } from "../_components/EducationForm";
import type { ExperienceField } from "../_components/ExperienceForm";
import {
  validateCertifications,
  validateExperiences,
  validateProfile,
  type ProfileFormErrors,
} from "@/lib/validation";
import { joinMonthYear, splitMonthYear } from "@/lib/format";

/* Wizard dùng đúng bộ luật chung — không thêm luật riêng.
 * `name` cố tình KHÔNG validate: nó luôn được prefill từ session và
 * `toProfileUpdate()` không gửi nó đi đâu cả (bảng profiles không có cột name). */
export type FormErrors = ProfileFormErrors & {
  certifications?: Record<string, string>;
  experiences?: Record<string, string>;
};

/* ── Utility: simple unique ID generator ── */
let nextId = 100;
export function uid(): number {
  return ++nextId;
}

/* ── Pure helpers — exported so page.tsx and ProfilePreview can use them ── */
export function calcCompleteness(data: ProfileData): number {
  let score = 0;
  if (data.name.trim()) score += 20;
  if (data.headline.trim()) score += 15;
  if (data.summary.trim()) score += 20;
  if (data.skills.length > 0) score += 20;
  if (data.education.length > 0 && data.education[0].university) score += 15;
  if (data.experiences.length > 0 && data.experiences[0].title) score += 10;
  return Math.min(score, 100);
}

export { getInitials } from "@/lib/format";

/** Tách start/end ISO của server thành 4 field month/year cho UI. */
function splitStartEnd(
  start?: string | null,
  end?: string | null,
): {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
} {
  const s = splitMonthYear(start || "");
  const e = splitMonthYear(end || "");
  return {
    startMonth: s.month,
    startYear: s.year,
    endMonth: e.month,
    endYear: e.year,
  };
}

/* ── Map wizard state → backend PUT /profile body ── */
function toProfileUpdate(data: ProfileData): ProfileUpdate {
  return {
    headline: data.headline.trim() || null,
    summary: data.summary.trim() || null,
    location: data.location.trim() || null,
    phone: data.phone.trim() || null,
    github_url: data.github.trim() || null,
    linkedin_url: data.linkedin.trim() || null,
    preferred_template: data.preferred_template,
    experiences: data.experiences
      .filter((e) => e.title.trim() && e.organization.trim())
      .map((e, i) => ({
        title: e.title.trim(),
        organization: e.organization.trim(),
        start_date: joinMonthYear(e.startMonth, e.startYear) || null,
        // isCurrent = đang làm -> backend nhận null và CV in "Present".
        end_date: e.isCurrent
          ? null
          : joinMonthYear(e.endMonth, e.endYear) || null,
        description: e.description.trim() || null,
        display_order: i,
      })),
    educations: data.education
      .filter((e) => e.university.trim())
      .map((e, i) => ({
        school: e.university.trim(),
        degree: e.degree.trim() || null,
        field_of_study: e.fieldOfStudy.trim() || null,
        start_date: joinMonthYear(e.startMonth, e.startYear) || null,
        end_date: joinMonthYear(e.endMonth, e.endYear) || null,
        description: e.description.trim() || null,
        display_order: i,
      })),
    certifications: data.certifications
      .filter((c) => c.title.trim() && c.month && c.year)
      .map((c, i) => ({
        title: c.title.trim(),
        obtain_date: joinMonthYear(c.month, c.year),
        display_order: i,
      })),
    skills: data.skills,
  };
}

/* ── Hook ── */
export function useProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [data, setData] = useState<ProfileData>({
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    github: "",
    linkedin: "",
    summary: "",
    preferred_template: "classic",
    education: [
      {
        id: uid(),
        university: "",
        degree: "",
        fieldOfStudy: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        description: "",
      },
    ],
    skills: ["Python", "C++", "SQL", "FastAPI"],
    experiences: [
      {
        id: uid(),
        title: "",
        organization: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        isCurrent: false,
        description: "",
      },
    ],
    certifications: [],
  });

  /* ── Guard: token required; profile already on server → skip onboarding ── */
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const prof = await getProfile();
        if (cancelled || !prof) return;

        setData((d) => ({
          ...d,
          headline: prof.headline || "",
          summary: prof.summary || "",
          location: prof.location || "",
          phone: prof.phone || "",
          github: prof.github_url || "",
          linkedin: prof.linkedin_url || "",
          preferred_template: prof.preferred_template || "classic",
          skills: prof.skills?.length
            ? prof.skills.map((s) => s.skill_name)
            : d.skills,
          // Nạp từ server: dùng lại id thật của server làm khoá, tách ISO ra
          // month/year cho UI.
          certifications:
            prof.certifications?.map((c) => ({
              id: c.id,
              title: c.title,
              ...splitMonthYear(c.obtain_date),
            })) ?? d.certifications,
          education: prof.educations?.length
            ? prof.educations.map((e) => ({
                id: e.id,
                university: e.school,
                degree: e.degree || "",
                fieldOfStudy: e.field_of_study || "",
                ...splitStartEnd(e.start_date, e.end_date),
                description: e.description || "",
              }))
            : d.education,
          experiences: prof.experiences?.length
            ? prof.experiences.map((e) => ({
                id: e.id,
                title: e.title,
                organization: e.organization || "",
                ...splitStartEnd(e.start_date, e.end_date),
                // Có start_date mà không có end_date -> đang làm, khớp cách CV
                // in "Present". Thiếu cả hai (dữ liệu cũ trước khi có form
                // này) nghĩa là chưa nhập ngày, KHÔNG phải đang làm.
                isCurrent: !!e.start_date && !e.end_date,
                description: e.description || "",
              }))
            : d.experiences,
        }));
      } catch {
        /* 404 (no profile yet) or network error — stay on empty form */
      }
    })();

    // Pre-fill email/name from the local session
    try {
      const raw = sessionStorage.getItem("careernav_session") || "{}";
      const session = JSON.parse(raw);
      setData((d) => ({
        ...d,
        email: session.email || "",
        name: (session.fullName || "").trim() || d.name,
      }));
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ── Toast ── */
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  /* ── Skills ── */
  const addSkill = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || data.skills.includes(trimmed)) return;
      setData((d) => ({ ...d, skills: [...d.skills, trimmed] }));
      showToast(`Added skill "${trimmed}"`);
    },
    [data.skills, showToast],
  );

  const removeSkill = (skill: string) => {
    setData((d) => ({ ...d, skills: d.skills.filter((s) => s !== skill) }));
  };

  const handleCustomSkillAdd = useCallback(() => {
    addSkill(customSkill);
    setCustomSkill("");
  }, [addSkill, customSkill]);

  /* ── Education ── */
  const addEducation = () => {
    setData((d) => ({
      ...d,
      education: [
        ...d.education,
        {
          id: uid(),
          university: "",
          degree: "",
          fieldOfStudy: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          description: "",
        },
      ],
    }));
    showToast("Added new education entry");
  };

  const removeEducation = (id: number | string) => {
    setData((d) => ({
      ...d,
      education: d.education.filter((e) => e.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateEducation = (
    id: number | string,
    field: EducationField,
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  /* ── Certifications ── */
  const addCertification = () => {
    setData((d) => ({
      ...d,
      certifications: [
        ...d.certifications,
        { id: uid(), title: "", month: "", year: "" },
      ],
    }));
    showToast("Added new certification entry");
  };

  const removeCertification = (id: number | string) => {
    setData((d) => ({
      ...d,
      certifications: d.certifications.filter((c) => c.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateCertification = (
    id: number | string,
    field: "title" | "month" | "year",
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      certifications: d.certifications.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  };

  /* ── Experiences (Work Experience) ── */
  const addExperience = () => {
    setData((d) => ({
      ...d,
      experiences: [
        ...d.experiences,
        {
          id: uid(),
          title: "",
          organization: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          isCurrent: false,
          description: "",
        },
      ],
    }));
    showToast("Added new experience entry");
  };

  const removeExperience = (id: number | string) => {
    setData((d) => ({
      ...d,
      experiences: d.experiences.filter((e) => e.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateExperience = (
    id: number | string,
    field: ExperienceField,
    value: string | boolean,
  ) => {
    setData((d) => ({
      ...d,
      experiences: d.experiences.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  /* ── Navigation ── */
  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── API save ──
   * `shouldValidate` false cho luồng Skip: user bấm Skip nghĩa là không muốn
   * điền, nên chặn họ lại vì một field sai định dạng là phản tác dụng. */
  const saveProfile = async (afterSaveMsg: string, shouldValidate = true) => {
    if (shouldValidate) {
      const errs = validateProfile({
        phone: data.phone,
        github: data.github,
        linkedin: data.linkedin,
      });
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        goToStep(1); // phone nằm ở step 1
        return;
      }

      const certErrs = validateCertifications(data.certifications);
      if (Object.keys(certErrs).length > 0) {
        setErrors({ certifications: certErrs });
        goToStep(2); // chứng chỉ nằm ở step 2
        return;
      }

      const expErrs = validateExperiences(data.experiences);
      if (Object.keys(expErrs).length > 0) {
        setErrors({ experiences: expErrs });
        goToStep(4); // kinh nghiệm nằm ở step 4
        return;
      }
    }
    setErrors({});

    setIsFinishing(true);
    try {
      await putProfile(toProfileUpdate(data));
      showToast(afterSaveMsg);
      // Onboarding: chưa có preferences → tiếp tục bước preferences;
      // đã có (user quay lại sửa profile) → về trang profile.
      let next = "/profile";
      try {
        await getPreferences();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          next = "/profile-preferences";
        }
      }
      setTimeout(() => router.push(next), 800);
    } catch (err) {
      // Lưu thất bại: ở lại wizard, báo lỗi thật — không giả vờ thành công.
      setIsFinishing(false);
      showToast(
        err instanceof ApiError
          ? `Save failed: ${err.message}`
          : "Cannot reach the server — profile not saved.",
      );
    }
  };

  const skipAndFinish = () => void saveProfile("Proceeding...", false);

  const completeSetup = () => void saveProfile("Profile saved!");

  return {
    data,
    setData,
    step,
    goToStep,
    toast,
    isFinishing,
    errors,
    customSkill,
    setCustomSkill,
    showToast,
    addSkill,
    removeSkill,
    handleCustomSkillAdd,
    addEducation,
    removeEducation,
    updateEducation,
    addCertification,
    removeCertification,
    updateCertification,
    addExperience,
    removeExperience,
    updateExperience,
    skipAndFinish,
    completeSetup,
  };
}
