export interface WorkExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  tags: string[];
  logoText: string;
  logoBg: string;
  logoColor: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  details?: string;
  icon: string;
}

export interface SkillCategory {
  title: string;
  level: 'expert' | 'advanced' | 'normal';
  skills: string[];
}

export interface CareerPreferencesSummary {
  targetRole: string;
  workType: string;
  salaryExpectation: string;
  location: string;
}

export interface MasterProfileData {
  id: string;
  name: string;
  headline: string;
  location: string;
  institution: string;
  email: string;
  avatarInitials: string;
  completionPercent: number;
  atsScorePercent: number;
  summary: string;
  experiences: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  preferences: CareerPreferencesSummary;
}
