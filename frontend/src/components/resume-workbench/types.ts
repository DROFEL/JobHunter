export interface WorkPoint {
  id: string
  text: string
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  year: string
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

export interface ResumeData {
  name: string
  email: string
  phone: string
  github: string
  linkedin: string
  position: string
  summary: string
  targetPosition: string
  targetCompany: string
  jobPostingLink: string
  aiJobSummary: string
  experiences: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  skillTypes: SkillTypeItem[]
}

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
}
