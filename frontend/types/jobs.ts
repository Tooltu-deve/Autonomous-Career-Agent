/**
 * Types for the Job Radar feature.
 * Previously inlined inside app/(app)/jobs/page.tsx.
 */
export interface Job {
  id: number;
  title: string;
  company: string;
  tagline: string;
  logoText: string;
  logoBg: string;
  location: string;
  address: string;
  salary: string;
  format: 'remote' | 'onsite' | 'hybrid';
  match: number;
  stage: 'saved' | 'applied' | 'interview' | 'none';
  isSaved: boolean;
  postedAgo: string;
  deadlineDays: number;
  tags: string[];
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  description: string;
  aiSummary: string;
}
