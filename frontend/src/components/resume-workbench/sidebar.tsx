import { useEffect, useState } from "react"
import { Bookmark, CalendarClock, ChevronLeft, ChevronRight, Clock3, FileText, MapPin, Plus, Search } from "lucide-react"

import type { JobStatus, SavedJob } from "@/components/resume-workbench/types.ts"
import { useSavedJobs } from "@/api/hooks/useSavedJobs.ts"
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
import { Input } from "@/components/ui/input.tsx"
import { cn } from "@/utils/utils.ts"

const PAGE_SIZE = 10

interface SelectedJobOverride {
  title?:          string
  company?:        string
  status?:         JobStatus
  employmentType?: string
  salary?:         string
  location?:       string
  deadline?:       string
}

interface SidebarProps {
  selectedJobId:       string
  selectedJobOverride?: SelectedJobOverride
  onSelectJob:         (job: SavedJob) => void
  onCreateFromTemplate:(templateId: string | null) => void
  /** Called once with the first available job when nothing is selected yet. */
  onInit?:             (job: SavedJob) => void
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
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function getInitials(company: string) {
  return company.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
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

export function Sidebar({ selectedJobId, selectedJobOverride, onSelectJob, onCreateFromTemplate, onInit }: SidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch]         = useState("")
  const [foundOnly, setFoundOnly]   = useState(false)
  const [page, setPage]             = useState(1)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => { setPage(1) }, [debouncedSearch, foundOnly])

  const { data } = useSavedJobs({
    page,
    page_size:  PAGE_SIZE,
    search:     debouncedSearch || undefined,
    status:     foundOnly ? "Found" : undefined,
    sort_by:    "posting_id",
    sort_order: "desc",
  })

  const jobs       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Seed initial job selection once when the sidebar first loads jobs and nothing is selected
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId && onInit) {
      onInit(jobs[0] as unknown as SavedJob)
    }
  // onInit is stable (defined inline in page.tsx but wrapped by useCallback there)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, selectedJobId])

  return (
    <>
      <Card className="flex min-h-full flex-col overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Saved Jobs</CardTitle>
              <CardDescription>{total} roles ready to tailor against</CardDescription>
            </div>
            <Button type="button" size="icon" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setFoundOnly((v) => !v)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                foundOnly
                  ? "border-primary/40 bg-accent shadow-sm"
                  : "border-border/60 text-muted-foreground hover:border-primary/20 hover:bg-accent/50",
              )}
            >
              Found only
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          {total === 0 && !debouncedSearch && !foundOnly ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
              No saved postings yet. The resume form and preview stay visible here, but they will remain disabled until a posting is available.
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-center text-sm text-muted-foreground">
              No jobs match your filters.
            </div>
          ) : null}

          {jobs.map((job) => {
            const selected = job.id === selectedJobId
            const display = selected && selectedJobOverride
              ? { ...job, ...selectedJobOverride }
              : job

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job as unknown as SavedJob)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-primary/30 bg-accent shadow-sm"
                    : "border-border/60 bg-background hover:border-primary/20 hover:bg-accent/50",
                )}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                    {getInitials(display.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{display.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{display.company}</p>
                      </div>
                      {job.saved ? <Bookmark className="mt-0.5 size-4 shrink-0 fill-primary text-primary" /> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {display.salary && <Badge variant="secondary">{display.salary}</Badge>}
                      {display.employmentType && <Badge variant="outline">{display.employmentType}</Badge>}
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[display.status as JobStatus])}>
                        {display.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {display.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0" />
                      <span className="truncate">{display.location}</span>
                    </div>
                  )}
                  {job.posted && (
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 shrink-0" />
                      <span>{formatDate(job.posted)}</span>
                    </div>
                  )}
                  {display.deadline && (() => {
                    const msLeft = new Date(display.deadline).getTime() - Date.now()
                    const urgent = msLeft <= 2 * 24 * 60 * 60 * 1000
                    return (
                      <div className={cn("flex items-center gap-2", urgent ? "text-amber-500" : "text-muted-foreground")}>
                        <CalendarClock className="size-4 shrink-0" />
                        <span>Due {formatDate(display.deadline)}</span>
                      </div>
                    )
                  })()}
                </div>
              </button>
            )
          })}

          {totalPages > 1 && (
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
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
