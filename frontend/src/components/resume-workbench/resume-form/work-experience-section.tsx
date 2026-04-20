import { Plus, Sparkles, Trash2, GripVertical } from "lucide-react"
import { Reorder } from "motion/react"

import type { ExperienceItem as ResumeExperienceItem } from "@/components/resume-workbench/types.ts"
import { WorkExperienceItem } from "@/components/resume-workbench/work-experience-item.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { createBlankExperience, createId } from "@/lib/resume-form-helpers.ts"

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
  function updateExperienceById(experienceId: string, updates: Partial<ResumeExperienceItem>) {
    onChange(
      experiences.map((experience) =>
        experience.id === experienceId ? { ...experience, ...updates } : experience,
      ),
    )
  }

  function reorderPoints(experienceId: string, nextPoints: ResumeExperienceItem["points"]) {
    onChange(
      experiences.map((experience) =>
        experience.id === experienceId ? { ...experience, points: nextPoints } : experience,
      ),
    )
  }

  function updateWorkPoint(experienceId: string, pointId: string, value: string) {
    onChange(
      experiences.map((experience) =>
        experience.id === experienceId
          ? {
              ...experience,
              points: experience.points.map((point) =>
                point.id === pointId ? { ...point, text: value } : point,
              ),
            }
          : experience,
      ),
    )
  }

  function removeWorkPoint(experienceId: string, pointId: string) {
    onChange(
      experiences.map((experience) => {
        if (experience.id !== experienceId) return experience

        const filteredPoints = experience.points.filter((point) => point.id !== pointId)
        const nextPoints =
          filteredPoints.length > 0
            ? filteredPoints
            : [{ id: createId("point"), text: "" }]

        return {
          ...experience,
          points: nextPoints,
        }
      }),
    )
  }

  function addWorkPoint(experienceId: string) {
    onChange(
      experiences.map((experience) =>
        experience.id === experienceId
          ? {
              ...experience,
              points: [...experience.points, { id: createId("point"), text: "" }],
            }
          : experience,
      ),
    )
  }

  function addExperience() {
    onChange([...experiences, createBlankExperience()])
  }

  function removeExperienceById(experienceId: string) {
    if (experiences.length === 1) {
      onChange([createBlankExperience()])
      return
    }

    onChange(experiences.filter((experience) => experience.id !== experienceId))
  }

  function suggestAchievement() {
    const suggestion = `Delivered ${
      targetPosition.toLowerCase() || "product"
    } improvements that simplified user flows and improved handoff quality across design and engineering.`

    if (experiences.length === 0) {
      onChange([
        {
          ...createBlankExperience(),
          points: [{ id: createId("point"), text: suggestion }],
        },
      ])
      return
    }

    const firstExperience = experiences[0]
    const emptyPoint = firstExperience.points.find((point) => point.text.trim().length === 0)

    if (emptyPoint) {
      updateWorkPoint(firstExperience.id, emptyPoint.id, suggestion)
      return
    }

    updateExperienceById(firstExperience.id, {
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

      <Reorder.Group
        axis="y"
        values={experiences}
        onReorder={onChange}
        className="flex flex-col gap-1"
      >
        {experiences.map((experience) => (
          <Reorder.Item
            key={experience.id}
            value={experience}
            className="list-none"
            style={{ position: "relative" }}
          >
            <Card className="rounded-xl border-border/60 bg-background shadow-none">
              <CardContent className="space-y-4 p-4 pr-14">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <Input
                      value={experience.company}
                      onChange={(event) =>
                        updateExperienceById(experience.id, { company: event.target.value })
                      }
                      placeholder="Tech Corp Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Duration</label>
                    <Input
                      value={experience.duration}
                      onChange={(event) =>
                        updateExperienceById(experience.id, { duration: event.target.value })
                      }
                      placeholder="Jan 2020 - Present"
                    />
                  </div>
                </div>

                <Reorder.Group
                  axis="y"
                  values={experience.points}
                  onReorder={(nextPoints) => reorderPoints(experience.id, nextPoints)}
                  className="flex flex-col gap-1"
                >
                  {experience.points.map((point, pointIndex) => (
                    <Reorder.Item
                      key={point.id}
                      value={point}
                      className="list-none"
                      style={{ position: "relative" }}
                    >
                      <div className="pr-10">
                        <WorkExperienceItem
                          point={point.text}
                          canMoveUp={pointIndex > 0}
                          canMoveDown={pointIndex < experience.points.length - 1}
                          isDragging={false}
                          moveUp={() => {}}
                          moveDown={() => {}}
                          updatePoint={(value) => updateWorkPoint(experience.id, point.id, value)}
                          removePoint={() => removeWorkPoint(experience.id, point.id)}
                        />
                      </div>

                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <GripVertical className="size-4" />
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => addWorkPoint(experience.id)}>
                    <Plus className="size-4" />
                    <span>Add Achievement</span>
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => removeExperienceById(experience.id)}>
                    <Trash2 className="size-4" />
                    <span>Remove Experience</span>
                  </Button>
                </div>
              </CardContent>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <GripVertical className="size-5" />
              </div>
            </Card>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <Button type="button" variant="outline" onClick={addExperience}>
        <Plus className="size-4" />
        <span>Add Company Experience</span>
      </Button>
    </section>
  )
}