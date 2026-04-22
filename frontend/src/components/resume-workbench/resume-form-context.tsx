import { createContext, useContext } from "react"
import type { JobResume, JobStatus } from "./types.ts"

export interface JobMeta {
  status: JobStatus
  employmentType: string
  salary: string
  location: string
  deadline: string
}

interface ResumeFormContextValue {
  data: JobResume
  onChange: (data: JobResume) => void
  updateField: <K extends keyof JobResume>(field: K, value: JobResume[K]) => void
  jobMeta: JobMeta | undefined
  onJobMetaChange: ((fields: Partial<JobMeta>) => void) | undefined
  selectedJobId: string
  scrapeStatus: string | null
  onGenerateSummary: () => void
}

export const ResumeFormContext = createContext<ResumeFormContextValue | null>(null)

export function useResumeForm(): ResumeFormContextValue {
  const ctx = useContext(ResumeFormContext)
  if (!ctx) throw new Error("useResumeForm must be used inside ResumeForm")
  return ctx
}
