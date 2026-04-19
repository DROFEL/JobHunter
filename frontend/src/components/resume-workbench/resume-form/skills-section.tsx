import { Plus, Trash2, X } from "lucide-react"

import type { SkillTypeItem } from "@/components/resume-workbench/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { ReorderList } from "@/components/ui/reorder-list.tsx"
import {
  buildSkillDragPayload,
  createBlankSkillType,
  parseSkillDragPayload,
  type SkillDragPayload,
} from "@/lib/resume-form-helpers.ts"

interface SkillsSectionProps {
  skillTypes: SkillTypeItem[]
  skillPool: string[]
  onChange: (skillTypes: SkillTypeItem[]) => void
}

export function SkillsSection({ skillTypes, skillPool, onChange }: SkillsSectionProps) {
  function updateSkillType(skillTypeIndex: number, updates: Partial<SkillTypeItem>) {
    const nextSkillTypes = [...skillTypes]
    nextSkillTypes[skillTypeIndex] = {
      ...nextSkillTypes[skillTypeIndex],
      ...updates,
    }
    onChange(nextSkillTypes)
  }

  function addSkillType() {
    onChange([...skillTypes, createBlankSkillType()])
  }

  function removeSkillType(skillTypeIndex: number) {
    if (skillTypes.length === 1) {
      onChange([createBlankSkillType()])
      return
    }

    onChange(skillTypes.filter((_, currentIndex) => currentIndex !== skillTypeIndex))
  }

  function removeSkillFromType(skillTypeIndex: number, skillIndex: number) {
    const skillType = skillTypes[skillTypeIndex]
    if (!skillType) return

    updateSkillType(skillTypeIndex, {
      skills: skillType.skills.filter((_, currentIndex) => currentIndex !== skillIndex),
    })
  }

  function moveSkillIntoType(targetTypeIndex: number, payload: SkillDragPayload) {
    const targetSkillType = skillTypes[targetTypeIndex]

    if (!targetSkillType || !payload.skill.trim()) {
      return
    }

    const nextSkillTypes = skillTypes.map((skillType) => ({
      ...skillType,
      skills: [...skillType.skills],
    }))

    if (payload.sourceTypeId) {
      const sourceSkillTypeIndex = nextSkillTypes.findIndex(
        (skillType) => skillType.id === payload.sourceTypeId,
      )

      if (sourceSkillTypeIndex >= 0) {
        nextSkillTypes[sourceSkillTypeIndex].skills =
          nextSkillTypes[sourceSkillTypeIndex].skills.filter((skill) => skill !== payload.skill)
      }
    }

    if (!nextSkillTypes[targetTypeIndex].skills.includes(payload.skill)) {
      nextSkillTypes[targetTypeIndex].skills.push(payload.skill)
    }

    onChange(nextSkillTypes)
  }

  function handleSkillTypeDrop(targetTypeIndex: number, payloadRaw: string) {
    const payload = parseSkillDragPayload(payloadRaw)
    if (!payload) return
    moveSkillIntoType(targetTypeIndex, payload)
  }

  const assignedSkills = new Set(
    skillTypes.flatMap((skillType) => skillType.skills.map((skill) => skill.trim())).filter(Boolean),
  )

  const availableSkillPool = skillPool.filter((skill) => !assignedSkills.has(skill.trim()))

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
      <div>
        <h3 className="text-lg font-semibold">Skills</h3>
        <p className="text-sm text-muted-foreground">
          Create skill types and drag skills from the global settings pool into each category.
        </p>
      </div>

      <ReorderList withDragHandle>
        {skillTypes.map((skillType, skillTypeIndex) => (
          <Card key={skillType.id} className="rounded-xl border-border/60 bg-background shadow-none">
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
                if (!skillPayloadRaw) return

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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkillType(skillTypeIndex)}
                >
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
            <p className="text-sm text-muted-foreground">
              All saved skills are already assigned to a type.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}