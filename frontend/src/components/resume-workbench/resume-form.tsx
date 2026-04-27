import { useState } from "react"

import { Card } from "@/components/ui/card.tsx"
import type { JobResume, JobStatus } from "@/components/resume-workbench/types.ts"
import { ResumeFormContext, type JobMeta } from "./resume-form-context.tsx"
import { ResumeHeaderSection } from "./resume-form/resume-header-section.tsx"
import { ResumeContentForm } from "./resume-content-form.tsx"
import { useBuilderGenerate } from "@/api/hooks/useAI.ts"
import { useProfileSettingsQuery, defaultProfileSettings } from "@/api/hooks/useProfileSettings.ts"
import { useSavedJob, useUpdateSavedJobResume } from "@/api/hooks/useSavedJobs.ts"
import { createId } from "@/utils/resume-form-helpers.ts"

interface ResumeFormProps {
  data: JobResume
  onChange: (data: JobResume) => void
  selectedJobId: string
  scrapeStatus?: string | null
  jobMeta?: JobMeta
  onJobMetaChange?: (fields: Partial<JobMeta>) => void
}

export function ResumeForm({ data, onChange, selectedJobId, scrapeStatus = null, jobMeta, onJobMetaChange }: ResumeFormProps) {
  const [aiLoadingKey, setAILoadingKey] = useState<string | null>(null)
  const { mutateAsync: callAI } = useBuilderGenerate()
  const { mutate: saveResume } = useUpdateSavedJobResume()
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { data: selectedJob } = useSavedJob(selectedJobId)

  function updateField<K extends keyof JobResume>(field: K, value: JobResume[K]) {
    onChange({ ...data, [field]: value })
  }

  function currentSkills(): string {
    return data.skillTypes.flatMap((st) => st.skills).filter(Boolean).join(", ")
  }

  async function onGenerateSummary() {
    if (aiLoadingKey) return
    setAILoadingKey("summary")
    try {
      const context = [
        selectedJob?.summary && `Job summary: ${selectedJob.summary}`,
        settings.experienceContext && `Candidate background: ${settings.experienceContext}`,
        currentSkills() && `Skills: ${currentSkills()}`,
      ].filter(Boolean).join("\n")

      const { result } = await callAI({
        call_type: "resume_summary",
        prompt: data.targetPosition || data.position || "Software Engineer",
        context,
      })
      const summary = result.slice(0, 260)
      updateField("summary", summary)
      if (selectedJobId) saveResume({ id: selectedJobId, resume: { ...data, summary } })
    } catch {
      // silent — field keeps previous value
    } finally {
      setAILoadingKey(null)
    }
  }

  async function onImproveWorkExperience(experienceId: string) {
    if (aiLoadingKey) return
    setAILoadingKey(`experience-${experienceId}`)
    try {
      const experience = data.experiences.find((e) => e.id === experienceId) ?? data.experiences[0]
      if (!experience) return

      const existing = experience.points.map((p) => p.text).filter(Boolean)
      const jobContext = [
        selectedJob?.summary,
        settings.experienceContext,
      ].filter(Boolean)

      const { result } = await callAI({
        call_type: "work_experience",
        prompt: `${experience.company}|${experience.duration}|${data.targetPosition || "Software Engineer"}`,
        context: existing.join("\n"),
        items: jobContext,
      })

      const bullets = result.split("\n").map((b) => b.trim()).filter(Boolean)
      const updatedExperiences = data.experiences.map((exp) =>
        exp.id !== experience.id
          ? exp
          : { ...exp, points: bullets.map((text) => ({ id: createId("point"), text })) },
      )
      updateField("experiences", updatedExperiences)
      if (selectedJobId) saveResume({ id: selectedJobId, resume: { ...data, experiences: updatedExperiences } })
    } catch {
      // silent
    } finally {
      setAILoadingKey(null)
    }
  }

  async function onGenerateProjectDescription(projectId: string) {
    if (aiLoadingKey) return
    setAILoadingKey(`project-${projectId}`)
    try {
      const project = data.projects.find((p) => p.id === projectId)
      if (!project) return

      const context = [
        `Target role: ${data.targetPosition || "Software Engineer"}`,
        selectedJob?.summary && `Job context: ${selectedJob.summary}`,
        currentSkills() && `Skills: ${currentSkills()}`,
      ].filter(Boolean).join("\n")

      const { result } = await callAI({
        call_type: "project_description",
        prompt: project.name || "the project",
        context,
      })

      const updatedProjects = data.projects.map((p) =>
        p.id === projectId ? { ...p, description: result.slice(0, 200) } : p,
      )
      updateField("projects", updatedProjects)
      if (selectedJobId) saveResume({ id: selectedJobId, resume: { ...data, projects: updatedProjects } })
    } catch {
      // silent
    } finally {
      setAILoadingKey(null)
    }
  }

  async function onGenerateSkills() {
    if (aiLoadingKey) return
    const skillPool = settings.skillPool.map((s) => s.trim()).filter(Boolean)
    if (skillPool.length === 0) return
    setAILoadingKey("skills")
    try {
      const prompt = [
        `Target role: ${data.targetPosition || data.targetCompany || "Software Engineer"}`,
        selectedJob?.summary && `Job context: ${selectedJob.summary}`,
      ].filter(Boolean).join("\n")

      const { result } = await callAI({
        call_type: "skills_suggestion",
        prompt,
        items: skillPool,
      })

      const parsed: Array<{ name: string; skills: string[] }> = JSON.parse(result)
      const newSkillTypes = parsed.map((category) => ({
        id: createId("skill-type"),
        name: category.name,
        skills: category.skills,
      }))
      updateField("skillTypes", newSkillTypes)
      if (selectedJobId) saveResume({ id: selectedJobId, resume: { ...data, skillTypes: newSkillTypes } })
    } catch {
      // silent — JSON.parse failure or API error keeps current skillTypes
    } finally {
      setAILoadingKey(null)
    }
  }

  return (
    <ResumeFormContext.Provider value={{
      data,
      onChange,
      updateField,
      jobMeta,
      onJobMetaChange,
      selectedJobId,
      scrapeStatus,
      onGenerateSummary,
      onImproveWorkExperience,
      onGenerateProjectDescription,
      onGenerateSkills,
      aiLoadingKey,
    }}>
      <div className="space-y-3">
        <Card className="overflow-hidden">
          <ResumeHeaderSection />
        </Card>

        <ResumeContentForm />
      </div>
    </ResumeFormContext.Provider>
  )
}
