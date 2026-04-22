import { FileText, Plus, Trash2 } from "lucide-react"

import type { ResumeTemplateDTO } from "@/api/hooks/useResumeTemplates.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { cn } from "@/utils/utils.ts"

interface TemplateSidebarProps {
  templates: ResumeTemplateDTO[]
  selectedId: string | null
  onSelect: (template: ResumeTemplateDTO) => void
  onNew: () => void
  onDelete: (id: string) => void
}

export function TemplateSidebar({ templates, selectedId, onSelect, onNew, onDelete }: TemplateSidebarProps) {
  return (
    <Card className="min-h-full overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>{templates.length} base resume{templates.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <Button type="button" size="icon" onClick={onNew}>
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 p-4">
        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            No templates yet. Click + to create your first base resume template.
          </div>
        ) : null}

        {templates.map((template) => {
          const selected = template.id === selectedId

          return (
            <div
              key={template.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(template)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(template)}
              className={cn(
                "group w-full cursor-pointer rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-primary/30 bg-accent shadow-sm"
                  : "border-border/60 bg-background hover:border-primary/20 hover:bg-accent/50",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{template.name || "Untitled Template"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {template.data.position || "No position set"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {template.data.experiences.length} experience{template.data.experiences.length !== 1 ? "s" : ""}
                    {" · "}
                    {template.data.skillTypes.length} skill group{template.data.skillTypes.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(template.id)
                  }}
                  className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
