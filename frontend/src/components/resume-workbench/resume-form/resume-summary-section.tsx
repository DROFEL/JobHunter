import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"

interface ResumeSummarySectionProps {
  position: string
  summary: string
  summaryLimit: number
  onPositionChange: (value: string) => void
  onSummaryChange: (value: string) => void
  onSuggestSummary: () => void
}

export function ResumeSummarySection({
  position,
  summary,
  summaryLimit,
  onPositionChange,
  onSummaryChange,
  onSuggestSummary,
}: ResumeSummarySectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Current Position</label>
        <Input
          value={position}
          onChange={(event) => onPositionChange(event.target.value)}
          placeholder="Senior Software Engineer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-foreground">Professional Summary</label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{summary.length}/{summaryLimit}</span>
            <Button type="button" size="sm" variant="ghost" onClick={onSuggestSummary}>
              <Sparkles className="size-3.5" />
              <span>AI Suggest</span>
            </Button>
          </div>
        </div>

        <Textarea
          value={summary}
          onChange={(event) => {
            if (event.target.value.length <= summaryLimit) {
              onSummaryChange(event.target.value)
            }
          }}
          maxLength={summaryLimit}
          rows={5}
          placeholder="Brief summary of your professional background..."
        />
      </div>
    </section>
  )
}