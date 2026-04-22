import { Card, CardContent } from "@/components/ui/card.tsx"
import { defaultProfileSettings, useProfileSettingsQuery } from "@/api/hooks/useProfileSettings.ts"
import { useResumeForm } from "./resume-form-context.tsx"
import { ProjectsSection } from "./resume-form/projects-section.tsx"
import { ResumeSummarySection } from "./resume-form/resume-summary-section.tsx"
import { SkillsSection } from "./resume-form/skills-section.tsx"
import { WorkExperienceSection } from "./resume-form/work-experience-section.tsx"
import { LanguagesToggleSection } from "./resume-form/languages-toggle-section.tsx"

const SUMMARY_LIMIT = 500
const PROJECT_DESC_LIMIT = 200

export function ResumeContentForm() {
  const { data, updateField } = useResumeForm()
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const skillPool = settings.skillPool.map((skill) => skill.trim()).filter(Boolean)

  function handleGenerateSummary() {
    const headline = data.position || "Software engineer"
    const highlightedSkills = data.skillTypes
      .flatMap((st) => st.skills)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ")

    updateField(
      "summary",
      `${headline} with a track record of shipping clear, high-quality interfaces. Strongest focus areas include ${highlightedSkills || "React, TypeScript, and product collaboration"} with an emphasis on accessible, measurable user experiences.`,
    )
  }

  return (
    <Card className="min-h-full overflow-hidden">
      <CardContent className="space-y-6 p-6">
        <ResumeSummarySection
          position={data.position}
          summary={data.summary}
          summaryLimit={SUMMARY_LIMIT}
          onPositionChange={(value) => updateField("position", value)}
          onSummaryChange={(value) => updateField("summary", value)}
          onSuggestSummary={handleGenerateSummary}
        />

        <WorkExperienceSection
          experiences={data.experiences}
          targetPosition=""
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

        {settings.languages.length > 0 && (
          <LanguagesToggleSection
            languages={settings.languages}
            enabledIds={data.enabledLanguageIds}
            onChange={(ids) => updateField("enabledLanguageIds", ids)}
          />
        )}
      </CardContent>
    </Card>
  )
}
