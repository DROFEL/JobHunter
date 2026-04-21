import { Building2, Link as LinkIcon, Sparkles } from "lucide-react"

import type { JobResume, JobStatus } from "@/components/resume-workbench/types.ts"
import { JOB_STATUSES } from "@/components/resume-workbench/types.ts"
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
import { getHostname } from "@/utils/resume-form-helpers.ts"

const EMPLOYMENT_TYPES = ["Remote", "Hybrid", "In-person"] as const

interface JobMeta {
  status: JobStatus
  employmentType: string
  salary: string
}

interface ResumeHeaderSectionProps {
  data: JobResume
  jobMeta?: JobMeta
  updateField: <K extends keyof JobResume>(field: K, value: JobResume[K]) => void
  onJobMetaChange?: (fields: Partial<JobMeta>) => void
  onGenerateSummary: () => void
}

export function ResumeHeaderSection({
  data,
  jobMeta,
  updateField,
  onJobMetaChange,
  onGenerateSummary,
}: ResumeHeaderSectionProps) {
  function handleFetchJobPosting() {
    const role = data.targetPosition || data.position || "Product-focused frontend role"
    const company = data.targetCompany || "the target company"
    const source = data.jobPostingLink ? getHostname(data.jobPostingLink) : "job board"

    updateField(
      "aiJobSummary",
      `${role} at ${company} emphasizes polished user experiences, collaborative product delivery, and measurable impact. Source saved from ${source}.`,
    )
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

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Target Company</label>
              <Input
                value={data.targetCompany}
                onChange={(event) => updateField("targetCompany", event.target.value)}
                className="border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
                placeholder="Target Company"
              />
            </div>

            {jobMeta && onJobMetaChange && (
              <>
                <div className="w-32 space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select
                    value={jobMeta.status}
                    onValueChange={(value) => onJobMetaChange({ status: value as JobStatus })}
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
              </>
            )}
          </div>
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

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleFetchJobPosting}>
            Fetch Posting
          </Button>
          <Button type="button" onClick={onGenerateSummary}>
            <Sparkles className="size-4" />
            <span>Generate Summary</span>
          </Button>
        </div>

        {data.aiJobSummary ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Job Summary</label>
            <p className="text-sm leading-relaxed text-muted-foreground">{data.aiJobSummary}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50">Fetched job summary will appear here…</p>
        )}
      </div>
    </CardHeader>
  )
}
