/**
 * Local types for the profile-setup wizard.
 * These are UI-layer types — separate from the API types in @/types/api.ts.
 */
import type { TemplateName } from "@/types/api";

/**
 * Server fields the wizard does NOT edit but must preserve on save:
 * PUT /profile replaces the whole profile + child tables, so anything we
 * drop here would be permanently erased from the user's profile.
 */
export interface EducationServerFields {
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export interface ExperienceServerFields {
  organization?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface EducationEntry {
  id: number;
  university: string;
  degree: string;
  server?: EducationServerFields;
}

export interface ProjectEntry {
  id: number;
  name: string;
  description: string;
  server?: ExperienceServerFields;
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
  projects: ProjectEntry[];
}

export const SUGGESTED_SKILLS = [
  "React",
  "Git",
  "Docker",
  "PostgreSQL",
  "English",
  "TypeScript",
  "Node.js",
  "AWS",
];
