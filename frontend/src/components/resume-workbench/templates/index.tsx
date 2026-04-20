import type { ResumeTemplate } from "./types.ts"
import { ClassicPdf } from "./classic.tsx"

export const classicTemplate: ResumeTemplate = {
  id: "classic",
  name: "Classic",
  description: "Traditional single-column layout, ATS-friendly.",
  render: (data) => <ClassicPdf data={data} />,
}

export const resumeTemplates: Record<string, ResumeTemplate> = {
  [classicTemplate.id]: classicTemplate,
}

export const defaultTemplateId = classicTemplate.id
export type { ResumeTemplate } from "./types.ts"