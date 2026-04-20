import { Download } from "lucide-react"
import { PDFViewer, pdf } from "@react-pdf/renderer"
import { useState } from "react"

import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { defaultTemplateId, resumeTemplates } from "./templates/index.tsx"

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface ResumePreviewProps {
  data: ResumeData
  templateId?: string
}

export function ResumePreview({ data, templateId = defaultTemplateId }: ResumePreviewProps) {
  const template = resumeTemplates[templateId] ?? resumeTemplates[defaultTemplateId]
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleDownload() {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const blob = await pdf(template.render(data)).toBlob()
      const filename = `${data.profile.name?.trim() || "resume"}.pdf`
      downloadBlob(blob, filename)
    } catch (error) {
      console.error("Failed to generate resume PDF", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="min-h-full overflow-hidden">
      <CardHeader className="no-print border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Resume Preview</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>

          <Button type="button" onClick={handleDownload} disabled={isGenerating}>
            <Download className="size-4" />
            <span>{isGenerating ? "Generating…" : "Download PDF"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="bg-accent/20 p-4 sm:p-6">
        <div className="mx-auto h-[11in] w-[8.5in] shadow-sm">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            {template.render(data)}
          </PDFViewer>
        </div>
      </CardContent>
    </Card>
  )
}