import { Building2, Link as LinkIcon, Plus, Sparkles, Trash2, X } from "lucide-react"

import { useProfileSettings } from "@/components/app/profile-settings-context.tsx"
import type {
  ExperienceItem as ResumeExperienceItem,
  ResumeData,
  SkillTypeItem,
} from "@/components/resume-workbench/types.ts"
import { WorkExperienceItem } from "@/components/resume-workbench/work-experience-item.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { ReorderList } from "@/components/ui/reorder-list.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"

interface ResumeFormProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
}

const SUMMARY_LIMIT = 500
const PROJECT_DESC_LIMIT = 200

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

function createBlankExperience(): ResumeExperienceItem {
  return {
    id: createId("experience"),
    company: "",
    duration: "",
    points: [{ id: createId("point"), text: "" }],
  }
}

function createBlankSkillType(): SkillTypeItem {
  return {
    id: createId("skill-type"),
    name: "",
    skills: [],
  }
}

interface SkillDragPayload {
  skill: string
  sourceTypeId: string | null
}

function getHostname(input: string) {
  try {
    const url = new URL(input)
    return url.hostname.replace(/^www\./, "")
  }
  catch {
    return "job board"
  }
}

export function ResumeForm({ data, onChange }: ResumeFormProps) {
  const { skillPool } = useProfileSettings()

  function updateField<K extends keyof ResumeData>(field: K, value: ResumeData[K]) {
    onChange({ ...data, [field]: value })
  }

  function updateExperience(experienceIndex: number, updates: Partial<ResumeExperienceItem>) {
    const nextExperiences = [...data.experiences]
    nextExperiences[experienceIndex] = {
      ...nextExperiences[experienceIndex],
      ...updates,
    }
    updateField("experiences", nextExperiences)
  }

  function moveWorkPoint(experienceIndex: number, dragIndex: number, hoverIndex: number) {
    const experience = data.experiences[experienceIndex]

    if (
      !experience
      || dragIndex === hoverIndex
      || dragIndex < 0
      || hoverIndex < 0
      || dragIndex >= experience.points.length
      || hoverIndex >= experience.points.length
    ) {
      return
    }

    const nextExperiences = [...data.experiences]
    const nextPoints = [...experience.points]
    const [removed] = nextPoints.splice(dragIndex, 1)
    nextPoints.splice(hoverIndex, 0, removed)
    nextExperiences[experienceIndex] = {
      ...experience,
      points: nextPoints,
    }
    updateField("experiences", nextExperiences)
  }

  function updateWorkPoint(experienceIndex: number, pointIndex: number, value: string) {
    const experience = data.experiences[experienceIndex]

    if (!experience) {
      return
    }

    const nextPoints = [...experience.points]
    nextPoints[pointIndex] = { ...nextPoints[pointIndex], text: value }
    updateExperience(experienceIndex, { points: nextPoints })
  }

  function removeWorkPoint(experienceIndex: number, pointIndex: number) {
    const experience = data.experiences[experienceIndex]

    if (!experience) {
      return
    }

    const filteredPoints = experience.points.filter((_, currentIndex) => currentIndex !== pointIndex)
    const nextPoints = filteredPoints.length > 0
      ? filteredPoints
      : [{ id: createId("point"), text: "" }]
    updateExperience(experienceIndex, { points: nextPoints })
  }

  function addWorkPoint(experienceIndex: number) {
    const experience = data.experiences[experienceIndex]

    if (!experience) {
      return
    }

    updateExperience(experienceIndex, {
      points: [...experience.points, { id: createId("point"), text: "" }],
    })
  }

  function addExperience() {
    updateField("experiences", [...data.experiences, createBlankExperience()])
  }

  function removeExperience(experienceIndex: number) {
    if (data.experiences.length === 1) {
      updateField("experiences", [createBlankExperience()])
      return
    }

    updateField(
      "experiences",
      data.experiences.filter((_, currentIndex) => currentIndex !== experienceIndex),
    )
  }

  function addEducation() {
    updateField("education", [
      ...data.education,
      { id: createId("education"), school: "", degree: "", year: "" },
    ])
  }

  function updateEducation(index: number, field: "school" | "degree" | "year", value: string) {
    const nextEducation = [...data.education]
    nextEducation[index] = { ...nextEducation[index], [field]: value }
    updateField("education", nextEducation)
  }

  function removeEducation(index: number) {
    updateField(
      "education",
      data.education.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  function addProject() {
    updateField("projects", [
      ...data.projects,
      { id: createId("project"), name: "", description: "" },
    ])
  }

  function updateProject(index: number, field: "name" | "description", value: string) {
    const nextProjects = [...data.projects]
    nextProjects[index] = { ...nextProjects[index], [field]: value }
    updateField("projects", nextProjects)
  }

  function removeProject(index: number) {
    updateField(
      "projects",
      data.projects.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  function updateSkillType(skillTypeIndex: number, updates: Partial<SkillTypeItem>) {
    const nextSkillTypes = [...data.skillTypes]
    nextSkillTypes[skillTypeIndex] = {
      ...nextSkillTypes[skillTypeIndex],
      ...updates,
    }
    updateField("skillTypes", nextSkillTypes)
  }

  function addSkillType() {
    updateField("skillTypes", [...data.skillTypes, createBlankSkillType()])
  }

  function removeSkillType(skillTypeIndex: number) {
    if (data.skillTypes.length === 1) {
      updateField("skillTypes", [createBlankSkillType()])
      return
    }

    updateField(
      "skillTypes",
      data.skillTypes.filter((_, currentIndex) => currentIndex !== skillTypeIndex),
    )
  }

  function removeSkillFromType(skillTypeIndex: number, skillIndex: number) {
    const skillType = data.skillTypes[skillTypeIndex]

    if (!skillType) {
      return
    }

    updateSkillType(skillTypeIndex, {
      skills: skillType.skills.filter((_, currentIndex) => currentIndex !== skillIndex),
    })
  }

  function buildSkillDragPayload(skill: string, sourceTypeId: string | null) {
    return JSON.stringify({
      skill,
      sourceTypeId,
    } satisfies SkillDragPayload)
  }

  function parseSkillDragPayload(rawPayload: string): SkillDragPayload | null {
    try {
      const parsed = JSON.parse(rawPayload) as Partial<SkillDragPayload>

      if (typeof parsed.skill !== "string") {
        return null
      }

      return {
        skill: parsed.skill,
        sourceTypeId: parsed.sourceTypeId ?? null,
      }
    }
    catch {
      return null
    }
  }

  function moveSkillIntoType(targetTypeIndex: number, payload: SkillDragPayload) {
    const targetSkillType = data.skillTypes[targetTypeIndex]

    if (!targetSkillType || !payload.skill.trim()) {
      return
    }

    const nextSkillTypes = data.skillTypes.map((skillType) => ({ ...skillType, skills: [...skillType.skills] }))

    if (payload.sourceTypeId) {
      const sourceSkillTypeIndex = nextSkillTypes.findIndex((skillType) => skillType.id === payload.sourceTypeId)

      if (sourceSkillTypeIndex >= 0) {
        nextSkillTypes[sourceSkillTypeIndex].skills = nextSkillTypes[sourceSkillTypeIndex]
          .skills
          .filter((skill) => skill !== payload.skill)
      }
    }

    if (!nextSkillTypes[targetTypeIndex].skills.includes(payload.skill)) {
      nextSkillTypes[targetTypeIndex].skills.push(payload.skill)
    }

    updateField("skillTypes", nextSkillTypes)
  }

  function handleSkillTypeDrop(targetTypeIndex: number, payloadRaw: string) {
    const payload = parseSkillDragPayload(payloadRaw)

    if (!payload) {
      return
    }

    moveSkillIntoType(targetTypeIndex, payload)
  }

  function handleFetchJobPosting() {
    const role = data.targetPosition || data.position || "Product-focused frontend role"
    const company = data.targetCompany || "the target company"
    const source = data.jobPostingLink ? getHostname(data.jobPostingLink) : "job board"

    updateField(
      "aiJobSummary",
      `${role} at ${company} emphasizes polished user experiences, collaborative product delivery, and measurable impact. Source saved from ${source}.`,
    )
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

  function handleAISuggestion(field: "summary" | "achievements") {
    if (field === "summary") {
      handleGenerateAISummary()
      return
    }

    const suggestion = `Delivered ${data.targetPosition.toLowerCase() || "product"} improvements that simplified user flows and improved handoff quality across design and engineering.`

    if (data.experiences.length === 0) {
      updateField("experiences", [{
        ...createBlankExperience(),
        points: [{ id: createId("point"), text: suggestion }],
      }])
      return
    }

    const firstExperience = data.experiences[0]
    const emptyPointIndex = firstExperience.points.findIndex((point) => point.text.trim().length === 0)

    if (emptyPointIndex >= 0) {
      updateWorkPoint(0, emptyPointIndex, suggestion)
      return
    }

    updateExperience(0, {
      points: [...firstExperience.points, { id: createId("point"), text: suggestion }],
    })
  }

  const assignedSkills = new Set(
    data.skillTypes.flatMap((skillType) => skillType.skills.map((skill) => skill.trim())).filter(Boolean),
  )
  const availableSkillPool = skillPool.filter((skill) => !assignedSkills.has(skill.trim()))


  return (
    <Card className="min-h-full overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-accent/40 text-muted-foreground">
            <Building2 className="size-6" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Target Position</label>
                <Input
                  value={data.targetPosition}
                  onChange={(event) => updateField("targetPosition", event.target.value)}
                  className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                  placeholder="Position Title"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Target Company</label>
                <Input
                  value={data.targetCompany}
                  onChange={(event) => updateField("targetCompany", event.target.value)}
                  className="border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
                  placeholder="Target Company"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{data.targetCompany || "Target role"}</Badge>
              <Badge variant="secondary">AI assisted tailoring</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={data.jobPostingLink}
              onChange={(event) => updateField("jobPostingLink", event.target.value)}
              className="pl-10"
              placeholder="Job posting URL"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleFetchJobPosting}>
              Fetch Posting
            </Button>
            <Button type="button" onClick={handleGenerateAISummary}>
              <Sparkles className="size-4" />
              <span>Generate Summary</span>
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Job Summary</label>
            <Textarea
              value={data.aiJobSummary}
              readOnly
              rows={3}
              className="min-h-24 resize-none bg-accent/30 text-muted-foreground"
              placeholder="Fetched job summary will appear here..."
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Position</label>
            <Input
              value={data.position}
              onChange={(event) => updateField("position", event.target.value)}
              placeholder="Senior Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground">Professional Summary</label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{data.summary.length}/{SUMMARY_LIMIT}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => handleAISuggestion("summary")}>
                  <Sparkles className="size-3.5" />
                  <span>AI Suggest</span>
                </Button>
              </div>
            </div>
            <Textarea
              value={data.summary}
              onChange={(event) => {
                if (event.target.value.length <= SUMMARY_LIMIT) {
                  updateField("summary", event.target.value)
                }
              }}
              maxLength={SUMMARY_LIMIT}
              rows={5}
              placeholder="Brief summary of your professional background..."
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <p className="text-sm text-muted-foreground">
                Add multiple companies and drag any achievement row to reorder vertically.
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => handleAISuggestion("achievements")}>
              <Sparkles className="size-3.5" />
              <span>AI Suggest</span>
            </Button>
          </div>

          <ReorderList withDragHandle>
            {data.experiences.map((experience, experienceIndex) => (
              <Card key={experience.id} className="rounded-xl border-border/60 bg-background shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Company Name</label>
                      <Input
                        value={experience.company}
                        onChange={(event) => updateExperience(experienceIndex, { company: event.target.value })}
                        placeholder="Tech Corp Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Duration</label>
                      <Input
                        value={experience.duration}
                        onChange={(event) => updateExperience(experienceIndex, { duration: event.target.value })}
                        placeholder="Jan 2020 - Present"
                      />
                    </div>
                  </div>

                  <ReorderList>
                    {experience.points.map((point, pointIndex) => (
                      <WorkExperienceItem
                        key={point.id}
                        point={point.text}
                        canMoveUp={pointIndex > 0}
                        canMoveDown={pointIndex < experience.points.length - 1}
                        isDragging={false}
                        moveUp={() => moveWorkPoint(experienceIndex, pointIndex, pointIndex - 1)}
                        moveDown={() => moveWorkPoint(experienceIndex, pointIndex, pointIndex + 1)}
                        updatePoint={(value) => updateWorkPoint(experienceIndex, pointIndex, value)}
                        removePoint={() => removeWorkPoint(experienceIndex, pointIndex)}
                      />
                    ))}
                  </ReorderList>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => addWorkPoint(experienceIndex)}>
                      <Plus className="size-4" />
                      <span>Add Achievement</span>
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => removeExperience(experienceIndex)}>
                      <Trash2 className="size-4" />
                      <span>Remove Experience</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ReorderList>

          <Button type="button" variant="outline" onClick={addExperience}>
            <Plus className="size-4" />
            <span>Add Company Experience</span>
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
          <div>
            <h3 className="text-lg font-semibold">Education</h3>
            <p className="text-sm text-muted-foreground">Add schools, credentials, or certifications</p>
          </div>

          {data.education.map((education, index) => (
            <Card key={education.id} className="rounded-xl border-border/60 bg-background shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={education.school}
                    onChange={(event) => updateEducation(index, "school", event.target.value)}
                    className="sm:col-span-2"
                    placeholder="School or University"
                  />
                  <Input
                    value={education.degree}
                    onChange={(event) => updateEducation(index, "degree", event.target.value)}
                    placeholder="Degree"
                  />
                  <Input
                    value={education.year}
                    onChange={(event) => updateEducation(index, "year", event.target.value)}
                    placeholder="Year"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeEducation(index)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addEducation}>
            <Plus className="size-4" />
            <span>Add Education</span>
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
          <div>
            <h3 className="text-lg font-semibold">Projects</h3>
            <p className="text-sm text-muted-foreground">Highlight relevant work you can speak to in interviews</p>
          </div>

          {data.projects.map((project, index) => (
            <Card key={project.id} className="rounded-xl border-border/60 bg-background shadow-none">
              <CardContent className="space-y-3 p-4">
                <Input
                  value={project.name}
                  onChange={(event) => updateProject(index, "name", event.target.value)}
                  placeholder="Project Name"
                />

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Description</span>
                  <span>{project.description.length}/{PROJECT_DESC_LIMIT}</span>
                </div>

                <Textarea
                  value={project.description}
                  onChange={(event) => {
                    if (event.target.value.length <= PROJECT_DESC_LIMIT) {
                      updateProject(index, "description", event.target.value)
                    }
                  }}
                  maxLength={PROJECT_DESC_LIMIT}
                  rows={3}
                  className="min-h-24"
                  placeholder="Brief project description..."
                />

                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeProject(index)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addProject}>
            <Plus className="size-4" />
            <span>Add Project</span>
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
          <div>
            <h3 className="text-lg font-semibold">Skills</h3>
            <p className="text-sm text-muted-foreground">
              Create skill types and drag skills from the global settings pool into each category.
            </p>
          </div>

          <ReorderList withDragHandle>
            {data.skillTypes.map((skillType, skillTypeIndex) => (
              <Card
                key={skillType.id}
                className="rounded-xl border-border/60 bg-background shadow-none"
              >
                <CardContent
                  className="space-y-3 p-4"
                  onDragOver={(event) => {
                    if (event.dataTransfer.types.includes("application/x-jobhunter-skill")) {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "move"
                    }
                  }}
                  onDrop={(event) => {
                    const skillPayloadRaw = event.dataTransfer.getData("application/x-jobhunter-skill")

                    if (!skillPayloadRaw) {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()
                    handleSkillTypeDrop(skillTypeIndex, skillPayloadRaw)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={skillType.name}
                      onChange={(event) => updateSkillType(skillTypeIndex, { name: event.target.value })}
                      placeholder="Skill Type (e.g., Frontend, Backend)"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => 
                      removeSkillType(skillTypeIndex)
                      }>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="min-h-16 rounded-lg border border-dashed border-border/70 bg-accent/20 p-3">
                    {skillType.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillType.skills.map((skill, skillIndex) => (
                          <div
                            key={`${skillType.id}-${skill}-${skillIndex}`}
                            draggable
                            onDragStart={(event) => {
                              event.stopPropagation()
                              event.dataTransfer.effectAllowed = "move"
                              event.dataTransfer.setData(
                                "application/x-jobhunter-skill",
                                buildSkillDragPayload(skill, skillType.id),
                              )
                            }}
                            className="inline-flex cursor-grab items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm active:cursor-grabbing"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkillFromType(skillTypeIndex, skillIndex)}
                              className="text-muted-foreground transition hover:text-foreground"
                              aria-label={`Remove ${skill}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Drop skills here</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ReorderList>

          <Button type="button" variant="outline" onClick={addSkillType}>
            <Plus className="size-4" />
            <span>Add Skill Type</span>
          </Button>

          <Card className="rounded-xl border-border/60 bg-background shadow-none">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base">Skills Pool (from Settings)</CardTitle>
              <CardDescription>Drag unassigned skills into any skill type above.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              {availableSkillPool.filter((skill) => skill.trim().length > 0).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSkillPool
                    .filter((skill) => skill.trim().length > 0)
                    .map((skill, index) => (
                      <div
                        key={`${skill}-${index}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "copyMove"
                          event.dataTransfer.setData(
                            "application/x-jobhunter-skill",
                            buildSkillDragPayload(skill, null),
                          )
                        }}
                        className="inline-flex cursor-grab items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm active:cursor-grabbing"
                      >
                        <span>{skill}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All saved skills are already assigned to a type.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </CardContent>
    </Card>
  )
}
