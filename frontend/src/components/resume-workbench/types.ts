export interface WorkPoint {
  id: string
  text: string
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  year: string
  description: string
}

export interface LanguageItem {
  id: string
  language: string
  level: string
}

export interface ProjectItem {
  id: string
  name: string
  description: string
}

export interface ExperienceItem {
  id: string
  company: string
  duration: string
  points: WorkPoint[]
}

export interface SkillTypeItem {
  id: string
  name: string
  skills: string[]
}

export interface ProfileSettings {
  name: string
  email: string
  phone: string
  github: string
  linkedin: string
}

// Per-job editable resume content — stored inside each SavedJob
export interface JobResume {
  position: string
  summary: string
  targetPosition: string
  targetCompany: string
  jobPostingLink: string
  aiJobSummary: string
  experiences: ExperienceItem[]
  projects: ProjectItem[]
  skillTypes: SkillTypeItem[]
  enabledLanguageIds: string[]
}

// Full assembled data passed to the PDF template
export interface ResumeData extends JobResume {
  profile: ProfileSettings
  education: EducationItem[]
  languages: LanguageItem[]
}

export const JOB_STATUSES = ["Found", "Applied", "Interview", "Offer", "Rejected"] as const
export type JobStatus = typeof JOB_STATUSES[number]

export interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  posted: string
  salary: string
  employmentType: string
  summary: string
  url: string
  saved: boolean
  status: JobStatus
  resume: JobResume
}
