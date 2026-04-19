import { Building2, Link as LinkIcon, Sparkles } from "lucide-react"

import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { CardHeader } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"
import { getHostname } from "@/lib/resume-form-helpers.ts"

interface ResumeHeaderSectionProps {
  data: ResumeData
  updateField: <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => void
  onGenerateSummary: () => void
}

export function ResumeHeaderSection({
  data,
  updateField,
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Target Position</label>
              <Input
                value={data.targetPosition}
                onChange={(event) => updateField("targetPosition", event.target.value)}
                className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                placeholder="Position Title"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Target Company</label>
              <Input
                value={data.targetCompany}
                onChange={(event) => updateField("targetCompany", event.target.value)}
                className="border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0"
                placeholder="Target Company"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{data.targetCompany || "Target role"}</Badge>
            <Badge variant="secondary">AI assisted tailoring</Badge>
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Job Summary</label>
          <Textarea
            value={data.aiJobSummary}
            readOnly
            rows={3}
            className="min-h-24 resize-none bg-accent/30 text-muted-foreground"
            placeholder="Fetched job summary will appear here..."
          />
        </div>
      </div>
    </CardHeader>
  )
}