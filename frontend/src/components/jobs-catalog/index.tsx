import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Bookmark, CalendarClock, ChevronLeft, ChevronRight, Clock3, ExternalLink, ListChecks, MapPin, Search } from "lucide-react"

import { JOB_STATUSES, type JobStatus } from "@/components/resume-workbench/types.ts"
import { useSavedJobs, useUpdateSavedJob, type SavedJobDTO } from "@/api/hooks/useSavedJobs.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { cn } from "@/utils/utils.ts"

const PAGE_SIZE = 20

type SortKey = "posted-desc" | "posted-asc" | "deadline-asc" | "company-az" | "status-pipeline" | "title-az"

const SORT_LABELS: Record<SortKey, string> = {
  "posted-desc":     "Newest first",
  "posted-asc":      "Oldest first",
  "deadline-asc":    "Deadline (soonest)",
  "company-az":      "Company A–Z",
  "status-pipeline": "Status (pipeline)",
  "title-az":        "Title A–Z",
}

const SORT_FIELD: Record<SortKey, string> = {
  "posted-desc":     "posted",
  "posted-asc":      "posted",
  "deadline-asc":    "deadline",
  "company-az":      "company",
  "status-pipeline": "status",
  "title-az":        "title",
}

const SORT_ORDER: Record<SortKey, "asc" | "desc"> = {
  "posted-desc":     "desc",
  "posted-asc":      "asc",
  "deadline-asc":    "asc",
  "company-az":      "asc",
  "status-pipeline": "asc",
  "title-az":        "asc",
}

const STATUS_STYLES: Record<JobStatus, string> = {
  Found:     "bg-secondary text-secondary-foreground",
  Applied:   "bg-blue-500/15 text-blue-500",
  Interview: "bg-amber-500/15 text-amber-500",
  Offer:     "bg-green-500/15 text-green-600",
  Rejected:  "bg-destructive/15 text-destructive",
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function formatDate(value: string) {
  const d = new Date(value)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function getInitials(company: string) {
  return company.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

function JobCard({ job }: { job: SavedJobDTO }) {
  const navigate = useNavigate()
  const { mutate: updateJob } = useUpdateSavedJob()

  const deadlineMs = job.deadline ? new Date(job.deadline).getTime() - Date.now() : Infinity
  const deadlineUrgent = isFinite(deadlineMs) && deadlineMs <= 2 * 24 * 60 * 60 * 1000

  return (
    <div
      onClick={() => navigate({ to: "/resume-builder" })}
      className="group cursor-pointer rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-primary/20 hover:bg-accent/30 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
          {getInitials(job.company) || "?"}
        </div>

        <div className="min-w-0 flex-1">
          {/* Row 1: title · company + bookmark + status dropdown */}
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold leading-tight">
              {job.title || "Untitled"}
              {job.company && (
                <span className="ml-1.5 font-normal text-muted-foreground">· {job.company}</span>
              )}
            </p>
            <div
              className="ml-auto flex shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Bookmark
                className={cn(
                  "size-3.5 transition-colors",
                  job.saved ? "fill-primary text-primary" : "text-muted-foreground/30",
                )}
              />
              <Select
                value={job.status}
                onValueChange={(val) => updateJob({ id: job.id, status: val as JobStatus })}
              >
                <SelectTrigger
                  className={cn(
                    "h-6 w-32 rounded-full border px-2.5 text-xs font-medium shadow-none",
                    STATUS_STYLES[job.status],
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: metadata */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate max-w-40">{job.location}</span>
              </span>
            )}
            {job.salary && <Badge variant="secondary" className="text-xs font-normal">{job.salary}</Badge>}
            {job.employmentType && <Badge variant="outline" className="text-xs font-normal">{job.employmentType}</Badge>}
            {job.posted && (
              <span className="flex items-center gap-1">
                <Clock3 className="size-3 shrink-0" />
                {formatDate(job.posted)}
              </span>
            )}
            {job.deadline && (
              <span className={cn("flex items-center gap-1", deadlineUrgent && "font-semibold text-amber-500")}>
                <CalendarClock className="size-3 shrink-0" />
                {formatDate(job.deadline)}
              </span>
            )}
            {job.scrapeStatus && <Badge variant="outline" className="text-xs font-normal">{job.scrapeStatus}</Badge>}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="size-3" />
                View posting
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-12 text-center">
      <ListChecks className="mx-auto mb-3 size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">No jobs match your filters</p>
      <p className="mt-1 text-xs text-muted-foreground/60">Try adjusting the search or status filter</p>
    </div>
  )
}

export function JobsCatalogPage() {
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState<JobStatus | "All">("All")
  const [savedOnly, setSavedOnly] = useState(false)
  const [sortKey, setSortKey]     = useState<SortKey>("posted-desc")
  const [page, setPage]           = useState(1)

  const debouncedSearch = useDebounce(search, 300)

  // Reset page when any filter/sort changes
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, savedOnly, sortKey])

  const { data, isLoading } = useSavedJobs({
    page,
    page_size:   PAGE_SIZE,
    search:      debouncedSearch || undefined,
    status:      statusFilter !== "All" ? statusFilter : undefined,
    saved_only:  savedOnly || undefined,
    sort_by:     SORT_FIELD[sortKey],
    sort_order:  SORT_ORDER[sortKey],
  })

  const jobs       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <Badge variant="secondary" className="text-sm">{total}</Badge>
        </div>

        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>{SORT_LABELS[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={savedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setSavedOnly((v) => !v)}
          >
            <Bookmark className={cn("size-4", savedOnly && "fill-current")} />
            Saved
          </Button>
        </div>

        {/* Status filter chips */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {(["All", ...JOB_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                statusFilter === s
                  ? "border-primary/40 bg-accent shadow-sm"
                  : "border-border/60 text-muted-foreground hover:border-primary/20 hover:bg-accent/50",
                s !== "All" && statusFilter === s && STATUS_STYLES[s as JobStatus],
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Job list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-24 text-center text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
