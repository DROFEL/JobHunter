import { z } from "zod"
import { JOB_STATUSES } from "@/components/resume-workbench/types.ts"

// Mirrors WorkPoint
const workPointSchema = z.object({
  id: z.string(),
  text: z.string(),
})

// Mirrors ExperienceItem
const experienceItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  duration: z.string(),
  points: z.array(workPointSchema),
})

// Mirrors ProjectItem
const projectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

// Mirrors SkillTypeItem
const skillTypeItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  skills: z.array(z.string()).default([]),
})

// Mirrors JobResume
export const jobResumeSchema = z.object({
  position: z.string(),
  summary: z.string(),
  targetPosition: z.string(),
  targetCompany: z.string(),
  jobPostingLink: z.string(),
  aiJobSummary: z.string(),
  experiences: z.array(experienceItemSchema),
  projects: z.array(projectItemSchema),
  skillTypes: z.array(skillTypeItemSchema),
  enabledLanguageIds: z.array(z.string()).default([]),
})

// Mirrors SavedJob
export const savedJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  posted: z.string(),
  salary: z.string(),
  employmentType: z.string(),
  summary: z.string(),
  url: z.string(),
  deadline: z.string().default(""),
  saved: z.boolean(),
  status: z.enum(JOB_STATUSES),
  scrapeStatus: z.string().nullable().default(null),
  resume: jobResumeSchema.nullable(),
})

export type JobResumeDTO = z.infer<typeof jobResumeSchema>
export type SavedJobDTO = z.infer<typeof savedJobSchema>
