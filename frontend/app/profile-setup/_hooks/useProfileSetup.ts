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
  if (data.projects.length > 0 && data.projects[0].name) score += 10;
  return Math.min(score, 100);
}

export { getInitials } from "@/lib/format";

/* ── Map wizard state → backend PUT /profile body ──
 * PUT /profile thay TOÀN BỘ profile + bảng con, nên các field wizard không
 * cho sửa (organization, ngày tháng, field_of_study, linkedin_url) phải được
 * gửi lại nguyên vẹn từ `server` ride-along — nếu không sẽ bị xoá vĩnh viễn. */
function toProfileUpdate(data: ProfileData): ProfileUpdate {
  return {
    headline: data.headline.trim() || null,
    summary: data.summary.trim() || null,
    location: data.location.trim() || null,
    phone: data.phone.trim() || null,
    github_url: data.github.trim() || null,
    linkedin_url: data.linkedin.trim() || null,
    preferred_template: data.preferred_template,
    experiences: data.projects
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        title: p.name.trim(),
        organization: p.server?.organization || "Personal Project",
        start_date: p.server?.start_date ?? null,
        end_date: p.server?.end_date ?? null,
        description: p.description.trim() || null,
        display_order: i,
      })),
    educations: data.education
      .filter((e) => e.university.trim())
      .map((e, i) => ({
        school: e.university.trim(),
        degree: e.degree.trim() || null,
        field_of_study: e.server?.field_of_study ?? null,
        start_date: e.server?.start_date ?? null,
        end_date: e.server?.end_date ?? null,
        description: e.server?.description ?? null,
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
    education: [{ id: uid(), university: "", degree: "" }],
    skills: ["Python", "C++", "SQL", "FastAPI"],
    projects: [{ id: uid(), name: "", description: "" }],
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
          education: prof.educations?.length
            ? prof.educations.map((e, idx) => ({
                id: idx + 1,
                university: e.school || "",
                degree: e.degree || "",
                // Giữ nguyên các field wizard không sửa để PUT không xoá mất
                server: {
                  field_of_study: e.field_of_study,
                  start_date: e.start_date,
                  end_date: e.end_date,
                  description: e.description,
                },
              }))
            : d.education,
          projects: prof.experiences?.length
            ? prof.experiences.map((exp, idx) => ({
                id: idx + 1,
                name: exp.title || "",
                description: exp.description || "",
                server: {
                  organization: exp.organization,
                  start_date: exp.start_date,
                  end_date: exp.end_date,
                },
              }))
            : d.projects,
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
      education: [...d.education, { id: uid(), university: "", degree: "" }],
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
    field: "university" | "degree",
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  /* ── Projects ── */
  const addProject = () => {
    setData((d) => ({
      ...d,
      projects: [...d.projects, { id: uid(), name: "", description: "" }],
    }));
    showToast("Added new project entry");
  };

  const removeProject = (id: number | string) => {
    setData((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateProject = (
    id: number | string,
    field: "name" | "description",
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  };

  /* ── Navigation ── */
  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── API save ── */
  const saveProfile = async (afterSaveMsg: string) => {
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

  const skipAndFinish = () => void saveProfile("Proceeding...");

  const completeSetup = () => void saveProfile("Profile saved!");

  return {
    data,
    setData,
    step,
    goToStep,
    toast,
    isFinishing,
    customSkill,
    setCustomSkill,
    showToast,
    addSkill,
    removeSkill,
    handleCustomSkillAdd,
    addEducation,
    removeEducation,
    updateEducation,
    addProject,
    removeProject,
    updateProject,
    skipAndFinish,
    completeSetup,
  };
}
