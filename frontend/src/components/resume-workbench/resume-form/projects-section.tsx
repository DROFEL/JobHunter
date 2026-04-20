import { Plus } from "lucide-react"

import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"
import { createBlankProject } from "@/utils/resume-form-helpers.ts";

interface ProjectsSectionProps {
  projects: ResumeData["projects"]
  projectDescriptionLimit: number
  onChange: (projects: ResumeData["projects"]) => void
}

export function ProjectsSection({
  projects,
  projectDescriptionLimit,
  onChange,
}: ProjectsSectionProps) {
  function addProject() {
    onChange([...projects, createBlankProject()])
  }

  function updateProject(index: number, field: "name" | "description", value: string) {
    const nextProjects = [...projects]
    nextProjects[index] = { ...nextProjects[index], [field]: value }
    onChange(nextProjects)
  }

  function removeProject(index: number) {
    onChange(projects.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
      <div>
        <h3 className="text-lg font-semibold">Projects</h3>
        <p className="text-sm text-muted-foreground">
          Highlight relevant work you can speak to in interviews
        </p>
      </div>

      {projects.map((project, index) => (
        <Card key={project.id} className="rounded-xl border-border/60 bg-background shadow-none">
          <CardContent className="space-y-3 p-4">
            <Input
              value={project.name}
              onChange={(event) => updateProject(index, "name", event.target.value)}
              placeholder="Project Name"
            />

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Description</span>
              <span>{project.description.length}/{projectDescriptionLimit}</span>
            </div>

            <Textarea
              value={project.description}
              onChange={(event) => {
                if (event.target.value.length <= projectDescriptionLimit) {
                  updateProject(index, "description", event.target.value)
                }
              }}
              maxLength={projectDescriptionLimit}
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
  )
}