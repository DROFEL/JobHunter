import { type ReactNode } from "react"
import { Reorder, useDragControls } from "motion/react"
import { GripVertical } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card.tsx"
import { defaultProfileSettings, useProfileSettingsQuery } from "@/api/hooks/useProfileSettings.ts"
import { RESUME_SECTION_IDS, type ResumeSectionId } from "@/components/resume-workbench/types.ts"
import { useResumeForm } from "./resume-form-context.tsx"
import { ProjectsSection } from "./resume-form/projects-section.tsx"
import { ResumeSummarySection } from "./resume-form/resume-summary-section.tsx"
import { SkillsSection } from "./resume-form/skills-section.tsx"
import { WorkExperienceSection } from "./resume-form/work-experience-section.tsx"
import { LanguagesToggleSection } from "./resume-form/languages-toggle-section.tsx"

const SUMMARY_LIMIT = 260
const PROJECT_DESC_LIMIT = 200

function SortableSection({ id, children }: { id: ResumeSectionId; children: ReactNode }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={id}
      dragControls={controls}
      dragListener={false}
      className="relative list-none"
    >
      <div
        className="absolute right-2 top-5 z-10 cursor-grab touch-none select-none text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="size-4" />
      </div>
      {children}
    </Reorder.Item>
  )
}

export function ResumeContentForm() {
  const {
    data,
    updateField,
    onGenerateSummary,
    onImproveWorkExperience,
    onGenerateProjectDescription,
    onGenerateSkills,
    aiLoadingKey,
  } = useResumeForm()
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const skillPool = settings.skillPool.map((skill) => skill.trim()).filter(Boolean)

  const order: ResumeSectionId[] = (data.sectionOrder as ResumeSectionId[] | undefined)
    ?? [...RESUME_SECTION_IDS]

  function renderSection(id: ResumeSectionId): ReactNode {
    switch (id) {
      case "summary":
        return (
          <ResumeSummarySection
            position={data.position}
            summary={data.summary}
            summaryLimit={SUMMARY_LIMIT}
            onPositionChange={(value) => updateField("position", value)}
            onSummaryChange={(value) => updateField("summary", value)}
            onSuggestSummary={onGenerateSummary}
            isLoading={aiLoadingKey === "summary"}
          />
        )
      case "education":
        return (
          <section className="rounded-xl border border-border/60 bg-accent/10 p-5 pr-8">
            <h3 className="text-base font-semibold">Education</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Managed in Profile Settings — drag to reposition on the resume.
            </p>
          </section>
        )
      case "experience":
        return (
          <WorkExperienceSection
            experiences={data.experiences}
            onChange={(value) => updateField("experiences", value)}
            onImproveExperience={onImproveWorkExperience}
            aiLoadingKey={aiLoadingKey}
          />
        )
      case "projects":
        return (
          <ProjectsSection
            projects={data.projects}
            projectDescriptionLimit={PROJECT_DESC_LIMIT}
            onChange={(value) => updateField("projects", value)}
            onSuggestDescription={onGenerateProjectDescription}
            aiLoadingKey={aiLoadingKey}
          />
        )
      case "skills":
        return (
          <SkillsSection
            skillTypes={data.skillTypes}
            skillPool={skillPool}
            onChange={(value) => updateField("skillTypes", value)}
            onSuggestSkills={onGenerateSkills}
            isLoading={aiLoadingKey === "skills"}
          />
        )
      case "languages":
        if (settings.languages.length === 0) return null
        return (
          <LanguagesToggleSection
            languages={settings.languages}
            enabledIds={data.enabledLanguageIds}
            onChange={(ids) => updateField("enabledLanguageIds", ids)}
          />
        )
    }
  }

  return (
    <Card className="min-h-full overflow-hidden">
      <CardContent className="p-6">
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={(newOrder) => updateField("sectionOrder", newOrder as ResumeSectionId[])}
          className="flex flex-col gap-6"
        >
          {order.map((id) => {
            const content = renderSection(id)
            if (content === null) return null
            return (
              <SortableSection key={id} id={id}>
                {content}
              </SortableSection>
            )
          })}
        </Reorder.Group>
      </CardContent>
    </Card>
  )
}
