import { useEffect, useMemo, useState } from "react"

import { initialResumeData, savedJobs } from "@/components/resume-workbench/mock-data.ts"
import { useProfileSettings } from "@/components/app/profile-settings-context.tsx"
import { ResumeForm } from "@/components/resume-workbench/resume-form.tsx"
import { ResumePreview } from "@/components/resume-workbench/resume-preview.tsx"
import { Sidebar } from "@/components/resume-workbench/sidebar.tsx"
import type { ResumeData, SavedJob } from "@/components/resume-workbench/types.ts"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"

const DEFAULT_PANEL_SIZES = [18, 42, 40] as const
const MIN_PANEL_SIZES = [16, 28, 24] as const
const DESKTOP_BREAKPOINT = 1280

function buildResumeFromJob(job: SavedJob, currentData: ResumeData): ResumeData {
  return {
    ...currentData,
    targetPosition: job.title,
    targetCompany: job.company,
    jobPostingLink: job.url,
    aiJobSummary: job.summary,
    position: currentData.position || job.title,
  }
}

export function ResumeWorkbenchPage() {
  const { profile, education } = useProfileSettings()
  const jobs = savedJobs
  const [selectedJobId, setSelectedJobId] = useState(savedJobs[0]?.id ?? "")
  const [resumeData, setResumeData] = useState(() =>
    buildResumeFromJob(savedJobs[0], initialResumeData),
  )
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const updateLayout = () => setIsDesktop(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)

    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  function handleSelectJob(job: SavedJob) {
    setSelectedJobId(job.id)
    setResumeData((currentData) => buildResumeFromJob(job, currentData))
  }

  const previewData = useMemo<ResumeData>(
    () => ({
      ...resumeData,
      profile: profile,
      education: education
    }),
    [profile, resumeData, education],
  )

  return (
    <main className="h-full min-h-0 overflow-hidden">
      {!isDesktop ? (
        <div className="h-full overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            <Sidebar
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
            />
            <ResumeForm data={resumeData} onChange={setResumeData} />
            <ResumePreview data={previewData} />
          </div>
        </div>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full"
        >
          <ResizablePanel
            defaultSize={DEFAULT_PANEL_SIZES[0]}
            minSize={MIN_PANEL_SIZES[0]}
            className="min-w-0"
          >
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              <Sidebar
                jobs={jobs}
                selectedJobId={selectedJobId}
                onSelectJob={handleSelectJob}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={DEFAULT_PANEL_SIZES[1]}
            minSize={MIN_PANEL_SIZES[1]}
            className="min-w-0"
          >
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              <ResumeForm data={resumeData} onChange={setResumeData} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={DEFAULT_PANEL_SIZES[2]}
            minSize={MIN_PANEL_SIZES[2]}
            className="min-w-0"
          >
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              <ResumePreview data={previewData} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  )
}