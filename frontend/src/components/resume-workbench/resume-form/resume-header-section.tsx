import { useState } from "react"
import { Building2, Link as LinkIcon, MapPin } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { JOB_STATUSES } from "@/components/resume-workbench/types.ts"
import { useResumeForm } from "@/components/resume-workbench/resume-form-context.tsx"
import { Button } from "@/components/ui/button.tsx"
import { CardHeader } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { useFetchPosting } from "../../../api/hooks/useAI.ts"
import { useSavedJobs } from "../../../api/hooks/useSavedJobs.ts"

const EMPLOYMENT_TYPES = ["Full time", "Part time", "Contract", "Internship", "Co-op"] as const

export function ResumeHeaderSection() {
  const { data, updateField, jobMeta, onJobMetaChange, selectedJobId, scrapeStatus } = useResumeForm()
  const fetchPosting = useFetchPosting()
  const { dataUpdatedAt } = useSavedJobs()
  const [clickedAt, setClickedAt] = useState<number | null>(null)

  const fetchDisabled =
    fetchPosting.isPending ||
    scrapeStatus === "Queued" ||
    scrapeStatus === "Started" ||
    (clickedAt !== null && dataUpdatedAt <= clickedAt)

  function handleFetchJobPosting() {
    setClickedAt(Date.now())
    fetchPosting.mutate({ url: data.jobPostingLink, posting_id: selectedJobId })
  }

  return (
    <CardHeader className="border-b border-border/60">
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-accent/40 text-muted-foreground">
          <Building2 className="size-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Position</label>
            <Input
              value={data.targetPosition}
              onChange={(event) => updateField("targetPosition", event.target.value)}
              className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
              placeholder="Position Title"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-foreground">Target Company</label>
            <Input
              value={data.targetCompany}
              onChange={(event) => updateField("targetCompany", event.target.value)}
              className="border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
              placeholder="Target Company"
            />
          </div>

          {jobMeta && onJobMetaChange && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-32 space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={jobMeta.status}
                  onValueChange={(value) => onJobMetaChange({ status: value as (typeof JOB_STATUSES)[number] })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32 space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select
                  value={jobMeta.employmentType}
                  onValueChange={(value) => onJobMetaChange({ employmentType: value })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36 space-y-2">
                <label className="text-sm font-medium text-foreground">Salary</label>
                <Input
                  value={jobMeta.salary}
                  onChange={(e) => onJobMetaChange({ salary: e.target.value })}
                  placeholder="$120k – $140k"
                  className="h-9 text-xs"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={jobMeta.location}
                    onChange={(e) => onJobMetaChange({ location: e.target.value })}
                    placeholder="City, Province"
                    className="h-9 pl-7 text-xs"
                  />
                </div>
              </div>

              <div className="w-36 space-y-2">
                <label className="text-sm font-medium text-foreground">Deadline</label>
                <Input
                  type="date"
                  value={jobMeta.deadline ? new Date(jobMeta.deadline).toISOString().slice(0, 10) : ""}
                  onChange={(e) => onJobMetaChange({ deadline: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            value={data.jobPostingLink}
            onChange={(event) => updateField("jobPostingLink", event.target.value)}
            className="pl-10"
            placeholder="Job posting URL"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleFetchJobPosting} disabled={fetchDisabled}>
            Fetch Posting
          </Button>
          {fetchPosting.isPending && (
            <span className="text-sm text-muted-foreground">Fetching…</span>
          )}
          {scrapeStatus && (
            <span className={`text-sm font-medium ${
              scrapeStatus === "Queued" ? "text-yellow-500" :
              scrapeStatus === "Started" ? "text-blue-500" :
              scrapeStatus === "Completed" ? "text-green-500" :
              scrapeStatus === "Failed" ? "text-destructive" :
              "text-muted-foreground"
            }`}>{scrapeStatus}</span>
          )}
        </div>

        {data.aiJobSummary ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Job Summary</label>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-sm text-muted-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-sm text-muted-foreground">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-muted-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                h1: ({ children }) => <h1 className="mb-1 text-sm font-semibold text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-1 text-sm font-semibold text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-medium text-foreground">{children}</h3>,
              }}
            >
              {data.aiJobSummary}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50">Fetched job summary will appear here…</p>
        )}
      </div>
    </CardHeader>
  )
}
