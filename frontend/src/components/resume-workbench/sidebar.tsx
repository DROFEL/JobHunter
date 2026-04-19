import { Bookmark, BriefcaseBusiness, Clock3, MapPin, Plus } from "lucide-react"

import type { SavedJob } from "@/components/resume-workbench/types.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"

interface SidebarProps {
  jobs: SavedJob[]
  selectedJobId: string
  onSelectJob: (job: SavedJob) => void
  onReorderJobs: (nextJobs: SavedJob[]) => void
}

function getInitials(company: string) {
  return company
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function Sidebar({ jobs, selectedJobId, onSelectJob }: SidebarProps) {
  const savedCount = jobs.filter((job) => job.saved).length

  return (
    <Card className="min-h-full overflow-hidden border-sidebar-border bg-sidebar text-sidebar-foreground">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>{savedCount} roles ready to tailor against</CardDescription>
          </div>
          <Button type="button" size="icon">
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 ">
        {jobs.map((job) => {
            const selected = job.id === selectedJobId

            return (
              <div
                key={job.id}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all my-2",
                  selected
                    ? "border-primary/30 bg-sidebar-accent shadow-sm"
                    : "border-sidebar-border bg-background hover:border-primary/20 hover:bg-accent/50",
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
                      <Badge variant="secondary">{job.salary}</Badge>
                      <Badge variant="outline">{job.employmentType}</Badge>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectJob(job)}
                  className="block w-full space-y-2 text-left text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4" />
                    <span>{job.posted}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <BriefcaseBusiness className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2 text-xs leading-relaxed">{job.summary}</span>
                  </div>
                </button>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
