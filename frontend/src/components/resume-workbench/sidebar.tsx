import { useState } from "react"
import { Bookmark, CalendarClock, Clock3, FileText, MapPin, Plus } from "lucide-react"

import type { JobStatus, SavedJob } from "@/components/resume-workbench/types.ts"
import { useResumeTemplates } from "@/api/hooks/useResumeTemplates.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx"
import { cn } from "@/utils/utils.ts"

interface SidebarProps {
  jobs: SavedJob[]
  selectedJobId: string
  onSelectJob: (job: SavedJob) => void
  onCreateFromTemplate: (templateId: string | null) => void
}

const STATUS_STYLES: Record<JobStatus, string> = {
  Found:     "bg-secondary text-secondary-foreground",
  Applied:   "bg-blue-500/15 text-blue-500",
  Interview: "bg-amber-500/15 text-amber-500",
  Offer:     "bg-green-500/15 text-green-600",
  Rejected:  "bg-destructive/15 text-destructive",
}

function formatDate(value: string) {
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function getInitials(company: string) {
  return company
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function TemplatePickerDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (templateId: string | null) => void
}) {
  const { data: templates = [], isLoading } = useResumeTemplates()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleCreate() {
    onCreate(selectedId)
    onClose()
    setSelectedId(null)
  }

  function handleClose() {
    onClose()
    setSelectedId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Job Entry</DialogTitle>
          <DialogDescription>
            Start from a template to pre-fill your resume, or create a blank entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-left text-sm transition-all",
              selectedId === null
                ? "border-primary/40 bg-accent shadow-sm"
                : "border-border/60 hover:border-primary/20 hover:bg-accent/50",
            )}
          >
            <span className="font-medium">Start blank</span>
            <p className="mt-0.5 text-xs text-muted-foreground">Empty resume, fill in from scratch</p>
          </button>

          {isLoading ? (
            <p className="py-2 text-center text-sm text-muted-foreground">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">No templates saved yet</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-sm transition-all",
                  selectedId === template.id
                    ? "border-primary/40 bg-accent shadow-sm"
                    : "border-border/60 hover:border-primary/20 hover:bg-accent/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{template.name}</span>
                </div>
                {template.data.position && (
                  <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{template.data.position}</p>
                )}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Sidebar({ jobs, selectedJobId, onSelectJob, onCreateFromTemplate }: SidebarProps) {
  const savedCount = jobs.filter((job) => job.saved).length
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <Card className="min-h-full overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Saved Jobs</CardTitle>
              <CardDescription>{savedCount} roles ready to tailor against</CardDescription>
            </div>
            <Button type="button" size="icon" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-2 p-4">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
              No saved postings yet. The resume form and preview stay visible here, but they will remain disabled until a posting is available.
            </div>
          ) : null}

          {jobs.map((job) => {
            const selected = job.id === selectedJobId

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-primary/30 bg-accent shadow-sm"
                    : "border-border/60 bg-background hover:border-primary/20 hover:bg-accent/50",
                )}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                    {getInitials(job.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{job.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      {job.saved ? <Bookmark className="mt-0.5 size-4 shrink-0 fill-primary text-primary" /> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
                      {job.employmentType && <Badge variant="outline">{job.employmentType}</Badge>}
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[job.status])}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  {job.posted && (
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 shrink-0" />
                      <span>{formatDate(job.posted)}</span>
                    </div>
                  )}
                  {job.deadline && (() => {
                    const msLeft = new Date(job.deadline).getTime() - Date.now()
                    const urgent = msLeft <= 2 * 24 * 60 * 60 * 1000
                    return (
                      <div className={cn("flex items-center gap-2", urgent ? "text-amber-500" : "text-muted-foreground")}>
                        <CalendarClock className="size-4 shrink-0" />
                        <span>Due {formatDate(job.deadline)}</span>
                      </div>
                    )
                  })()}
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <TemplatePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCreate={onCreateFromTemplate}
      />
    </>
  )
}
