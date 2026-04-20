import type { DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"
import type { ResumeData } from "@/components/resume-workbench/types.ts"

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  render: (data: ResumeData) => ReactElement<DocumentProps>
}