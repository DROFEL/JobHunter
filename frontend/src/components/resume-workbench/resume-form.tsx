import { Card } from "@/components/ui/card.tsx"
import type { JobResume, JobStatus } from "@/components/resume-workbench/types.ts"
import { ResumeHeaderSection } from "./resume-form/resume-header-section.tsx"
import { ResumeContentForm } from "./resume-content-form.tsx"

interface JobMeta {
  status: JobStatus
  employmentType: string
  salary: string
}

interface ResumeFormProps {
  data: JobResume
  onChange: (data: JobResume) => void
  jobMeta?: JobMeta
  onJobMetaChange?: (fields: Partial<JobMeta>) => void
}

export function ResumeForm({ data, onChange, jobMeta, onJobMetaChange }: ResumeFormProps) {
  function updateField<K extends keyof JobResume>(field: K, value: JobResume[K]) {
    onChange({ ...data, [field]: value })
  }

  function handleGenerateAISummary() {
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
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <ResumeHeaderSection
          data={data}
          jobMeta={jobMeta}
          updateField={updateField}
          onJobMetaChange={onJobMetaChange}
          onGenerateSummary={handleGenerateAISummary}
        />
      </Card>

      <ResumeContentForm data={data} onChange={onChange} />
    </div>
  )
}
