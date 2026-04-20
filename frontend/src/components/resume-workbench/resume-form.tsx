import { Card, CardContent } from "@/components/ui/card.tsx"
import {
  defaultProfileSettings,
  useProfileSettingsQuery,
} from "@/api/hooks/useProfileSettings.ts"
import type { JobResume } from "@/components/resume-workbench/types.ts"
import { ProjectsSection } from "./resume-form/projects-section.tsx";
import { ResumeHeaderSection } from "./resume-form/resume-header-section.tsx";
import { ResumeSummarySection } from "./resume-form/resume-summary-section.tsx";
import { SkillsSection } from "./resume-form/skills-section.tsx";
import { WorkExperienceSection } from "./resume-form/work-experience-section.tsx";

interface ResumeFormProps {
  data: JobResume
  onChange: (data: JobResume) => void
}

const SUMMARY_LIMIT = 500
const PROJECT_DESC_LIMIT = 200

export function ResumeForm({ data, onChange }: ResumeFormProps) {
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { skillPool } = settings

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

    updateField(
      "summary",
      `${headline} with a track record of shipping clear, high-quality interfaces${company}. Strongest focus areas include ${highlightedSkills || "React, TypeScript, and product collaboration"} with an emphasis on accessible, measurable user experiences.`,
    )
  }

  return (
    <Card className="min-h-full overflow-hidden">
      <ResumeHeaderSection
        data={data}
        updateField={updateField}
        onGenerateSummary={handleGenerateAISummary}
      />

      <CardContent className="space-y-6 p-6">
        <ResumeSummarySection
          position={data.position}
          summary={data.summary}
          summaryLimit={SUMMARY_LIMIT}
          onPositionChange={(value) => updateField("position", value)}
          onSummaryChange={(value) => updateField("summary", value)}
          onSuggestSummary={handleGenerateAISummary}
        />

        <WorkExperienceSection
          experiences={data.experiences}
          targetPosition={data.targetPosition}
          onChange={(value) => updateField("experiences", value)}
        />

        <ProjectsSection
          projects={data.projects}
          projectDescriptionLimit={PROJECT_DESC_LIMIT}
          onChange={(value) => updateField("projects", value)}
        />

        <SkillsSection
          skillTypes={data.skillTypes}
          skillPool={skillPool}
          onChange={(value) => updateField("skillTypes", value)}
        />
      </CardContent>
    </Card>
  )
}
