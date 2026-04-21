import { z } from "zod"
import { jobResumeSchema } from "@/api/schemas/savedJob.ts"

export const resumeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: jobResumeSchema,
})

export type ResumeTemplateDTO = z.infer<typeof resumeTemplateSchema>
