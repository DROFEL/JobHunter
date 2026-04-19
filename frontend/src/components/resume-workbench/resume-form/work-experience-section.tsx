import { Plus, Sparkles, Trash2 } from "lucide-react"

import type { ExperienceItem as ResumeExperienceItem } from "@/components/resume-workbench/types.ts"
import { WorkExperienceItem } from "@/components/resume-workbench/work-experience-item.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { ReorderList } from "@/components/ui/reorder-list.tsx"
import { createBlankExperience, createId } from "@/lib/resume-form-helpers.ts";

interface WorkExperienceSectionProps {
  experiences: ResumeExperienceItem[]
  targetPosition: string
  onChange: (experiences: ResumeExperienceItem[]) => void
}

export function WorkExperienceSection({
  experiences,
  targetPosition,
  onChange,
}: WorkExperienceSectionProps) {
  function updateExperience(experienceIndex: number, updates: Partial<ResumeExperienceItem>) {
    const nextExperiences = [...experiences]
    nextExperiences[experienceIndex] = {
      ...nextExperiences[experienceIndex],
      ...updates,
    }
    onChange(nextExperiences)
  }

  function moveWorkPoint(experienceIndex: number, dragIndex: number, hoverIndex: number) {
    const experience = experiences[experienceIndex]

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

    const nextExperiences = [...experiences]
    const nextPoints = [...experience.points]
    const [removed] = nextPoints.splice(dragIndex, 1)
    nextPoints.splice(hoverIndex, 0, removed)

    nextExperiences[experienceIndex] = {
      ...experience,
      points: nextPoints,
    }

    onChange(nextExperiences)
  }

  function updateWorkPoint(experienceIndex: number, pointIndex: number, value: string) {
    const experience = experiences[experienceIndex]
    if (!experience) return

    const nextPoints = [...experience.points]
    nextPoints[pointIndex] = { ...nextPoints[pointIndex], text: value }
    updateExperience(experienceIndex, { points: nextPoints })
  }

  function removeWorkPoint(experienceIndex: number, pointIndex: number) {
    const experience = experiences[experienceIndex]
    if (!experience) return

    const filteredPoints = experience.points.filter((_, currentIndex) => currentIndex !== pointIndex)
    const nextPoints = filteredPoints.length > 0
      ? filteredPoints
      : [{ id: createId("point"), text: "" }]

    updateExperience(experienceIndex, { points: nextPoints })
  }

  function addWorkPoint(experienceIndex: number) {
    const experience = experiences[experienceIndex]
    if (!experience) return

    updateExperience(experienceIndex, {
      points: [...experience.points, { id: createId("point"), text: "" }],
    })
  }

  function addExperience() {
    onChange([...experiences, createBlankExperience()])
  }

  function removeExperience(experienceIndex: number) {
    if (experiences.length === 1) {
      onChange([createBlankExperience()])
      return
    }

    onChange(experiences.filter((_, currentIndex) => currentIndex !== experienceIndex))
  }

  function suggestAchievement() {
    const suggestion = `Delivered ${targetPosition.toLowerCase() || "product"} improvements that simplified user flows and improved handoff quality across design and engineering.`

    if (experiences.length === 0) {
      onChange([{
        ...createBlankExperience(),
        points: [{ id: createId("point"), text: suggestion }],
      }])
      return
    }

    const firstExperience = experiences[0]
    const emptyPointIndex = firstExperience.points.findIndex((point) => point.text.trim().length === 0)

    if (emptyPointIndex >= 0) {
      updateWorkPoint(0, emptyPointIndex, suggestion)
      return
    }

    updateExperience(0, {
      points: [...firstExperience.points, { id: createId("point"), text: suggestion }],
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Work Experience</h3>
          <p className="text-sm text-muted-foreground">
            Add multiple companies and drag any achievement row to reorder vertically.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={suggestAchievement}>
          <Sparkles className="size-3.5" />
          <span>AI Suggest</span>
        </Button>
      </div>

      <ReorderList withDragHandle>
        {experiences.map((experience, experienceIndex) => (
          <Card key={experience.id} className="rounded-xl border-border/60 bg-background shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <Input
                    value={experience.company}
                    onChange={(event) =>
                      updateExperience(experienceIndex, { company: event.target.value })}
                    placeholder="Tech Corp Inc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Duration</label>
                  <Input
                    value={experience.duration}
                    onChange={(event) =>
                      updateExperience(experienceIndex, { duration: event.target.value })}
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
  )
}