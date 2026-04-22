import { Card } from "@/components/ui/card.tsx"
import type { JobResume } from "@/components/resume-workbench/types.ts"
import { ResumeFormContext, type JobMeta } from "./resume-form-context.tsx"
import { ResumeHeaderSection } from "./resume-form/resume-header-section.tsx"
import { ResumeContentForm } from "./resume-content-form.tsx"

interface ResumeFormProps {
  data: JobResume
  onChange: (data: JobResume) => void
  selectedJobId: string
  scrapeStatus?: string | null
  jobMeta?: JobMeta
  onJobMetaChange?: (fields: Partial<JobMeta>) => void
}

export function ResumeForm({ data, onChange, selectedJobId, scrapeStatus = null, jobMeta, onJobMetaChange }: ResumeFormProps) {
  function updateField<K extends keyof JobResume>(field: K, value: JobResume[K]) {
    onChange({ ...data, [field]: value })
  }

  function onGenerateSummary() {
    const headline = data.position || data.targetPosition || "Frontend engineer"
    const company = data.targetCompany ? ` for opportunities like ${data.targetCompany}` : ""
    const highlightedSkills = data.skillTypes
      .flatMap((skillType) => skillType.skills)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ")

    onChange({
      ...data,
      summary: `${headline} with a track record of shipping clear, high-quality interfaces${company}. Strongest focus areas include ${highlightedSkills || "React, TypeScript, and product collaboration"} with an emphasis on accessible, measurable user experiences.`,
    })
  }

  return (
    <ResumeFormContext.Provider value={{ data, onChange, updateField, jobMeta, onJobMetaChange, selectedJobId, scrapeStatus, onGenerateSummary }}>
      <div className="space-y-3">
        <Card className="overflow-hidden">
          <ResumeHeaderSection />
        </Card>

        <ResumeContentForm />
      </div>
    </ResumeFormContext.Provider>
  )
}
