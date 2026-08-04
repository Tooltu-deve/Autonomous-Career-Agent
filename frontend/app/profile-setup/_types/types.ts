/**
 * Local types for the profile-setup wizard.
 * These are UI-layer types — separate from the API types in @/types/api.ts.
 */
import type { TemplateName } from "@/types/api";

export interface EducationEntry {
  id: number;
  university: string;
  degree: string;
}

export interface ProjectEntry {
  id: number;
  name: string;
  description: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
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
