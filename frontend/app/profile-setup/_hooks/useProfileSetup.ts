"use client";

/**
 * useProfileSetup — custom hook chứa toàn bộ state và logic của wizard.
 * Components chỉ cần destructure giá trị/handler cần thiết từ hook này.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getPreferences, getProfile, getToken, putProfile } from "@/lib/api";
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

export function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Map wizard state → backend PUT /profile body ── */
function toProfileUpdate(data: ProfileData): ProfileUpdate {
  return {
    headline: data.headline.trim() || null,
    summary: data.summary.trim() || null,
    location: data.location.trim() || null,
    phone: data.phone.trim() || null,
    github_url: data.github.trim() || null,
    preferred_template: data.preferred_template,
    experiences: data.projects
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        title: p.name.trim(),
        organization: "Personal Project",
        description: p.description.trim() || null,
        display_order: i,
      })),
    educations: data.education
      .filter((e) => e.university.trim())
      .map((e, i) => ({
        school: e.university.trim(),
        degree: e.degree.trim() || null,
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
          preferred_template: prof.preferred_template || "classic",
          skills: prof.skills?.length
            ? prof.skills.map((s) => s.skill_name)
            : d.skills,
          education: prof.educations?.length
            ? prof.educations.map((e, idx) => ({
                id: idx + 1,
                university: e.school || "",
                degree: e.degree || "",
              }))
            : d.education,
          projects: prof.experiences?.length
            ? prof.experiences.map((exp, idx) => ({
                id: idx + 1,
                name: exp.title || "",
                description: exp.description || "",
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
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

  const removeEducation = (id: number) => {
    setData((d) => ({
      ...d,
      education: d.education.filter((e) => e.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateEducation = (
    id: number,
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

  const removeProject = (id: number) => {
    setData((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
    }));
    showToast("Entry removed");
  };

  const updateProject = (
    id: number,
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

    // Local storage fallback
    try {
      localStorage.setItem("careernav_profile_data", JSON.stringify(data));
    } catch {
      /* ignore */
    }

    try {
      await putProfile(toProfileUpdate(data));
      showToast(afterSaveMsg);
      setTimeout(() => router.push("/profile"), 800);
    } catch (err) {
      setIsFinishing(false);
      showToast(
        err instanceof ApiError
          ? err.message
          : "Profile saved locally! Returning to profile...",
      );
      setTimeout(() => router.push("/profile"), 800);
    }
  };

  const skipAndFinish = () =>
    void saveProfile("Proceeding to profile...");

  const completeSetup = () =>
    void saveProfile("Profile saved! Returning to profile...");

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
