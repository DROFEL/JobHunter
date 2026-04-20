import { Plus } from "lucide-react"

import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { createBlankEducation } from "@/utils/resume-form-helpers.ts";

interface EducationSectionProps {
  education: ResumeData["education"]
  onChange: (education: ResumeData["education"]) => void
}

export function EducationSection({ education, onChange }: EducationSectionProps) {
  function addEducation() {
    onChange([...education, createBlankEducation()])
  }

  function updateEducation(index: number, field: "school" | "degree" | "year", value: string) {
    const nextEducation = [...education]
    nextEducation[index] = { ...nextEducation[index], [field]: value }
    onChange(nextEducation)
  }

  function removeEducation(index: number) {
    onChange(education.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
      <div>
        <h3 className="text-lg font-semibold">Education</h3>
        <p className="text-sm text-muted-foreground">Add schools, credentials, or certifications</p>
      </div>

      {education.map((item, index) => (
        <Card key={item.id} className="rounded-xl border-border/60 bg-background shadow-none">
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={item.school}
                onChange={(event) => updateEducation(index, "school", event.target.value)}
                className="sm:col-span-2"
                placeholder="School or University"
              />
              <Input
                value={item.degree}
                onChange={(event) => updateEducation(index, "degree", event.target.value)}
                placeholder="Degree"
              />
              <Input
                value={item.year}
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
  )
}