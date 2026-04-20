import { useEffect, useMemo, useRef, useState } from "react"

import {
  defaultProfileSettings,
  useProfileSettingsQuery,
} from "@/api/hooks/useProfileSettings.ts"
import { ResumeForm } from "@/components/resume-workbench/resume-form.tsx"
import { ResumePreview } from "@/components/resume-workbench/resume-preview.tsx"
import { Sidebar } from "@/components/resume-workbench/sidebar.tsx"
import type { JobResume, ResumeData, SavedJob } from "@/components/resume-workbench/types.ts"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { useSavedJobs, useUpdateSavedJobResume } from "@/api/hooks/useSavedJobs.ts"

const DEFAULT_PANEL_SIZES = [18, 42, 40] as const
const MIN_PANEL_SIZES = [16, 28, 24] as const
const DESKTOP_BREAKPOINT = 1280

export function ResumeWorkbenchPage() {
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { data: jobs = [] } = useSavedJobs()
  const { mutate: saveResume } = useUpdateSavedJobResume()

  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [editingResume, setEditingResume] = useState<JobResume | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  // Seed selection once when jobs first arrive
  const initialized = useRef(false)
  useEffect(() => {
    if (jobs.length > 0 && !initialized.current) {
      initialized.current = true
      setSelectedJobId(jobs[0].id)
      setEditingResume(jobs[0].resume)
    }
  }, [jobs])

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const updateLayout = () => setIsDesktop(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener("change", updateLayout)

    return () => mediaQuery.removeEventListener("change", updateLayout)
  }, [])

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0]

  const sidebarJobs = useMemo(
    () =>
      jobs.map((job) => {
        if (job.id !== selectedJobId || !editingResume) {
          return job
        }

        return {
          ...job,
          title: editingResume.targetPosition || editingResume.position || job.title,
          company: editingResume.targetCompany || job.company,
        }
      }),
    [editingResume, jobs, selectedJobId],
  )

  function handleSelectJob(job: SavedJob) {
    // Persist edits for the current job before switching
    if (editingResume && selectedJobId) {
      saveResume({ id: selectedJobId, resume: editingResume })
    }
    setSelectedJobId(job.id)
    setEditingResume(job.resume)
  }

  function handleResumeChange(resume: JobResume) {
    setEditingResume(resume)
  }

  const currentResume = editingResume ?? selectedJob?.resume

  const previewData = useMemo<ResumeData>(
    () => ({ ...(currentResume as JobResume), profile: settings, education: settings.education }),
    [currentResume, settings],
  )

  if (!selectedJob || !currentResume) return null

  return (
    <main className="h-full min-h-0 overflow-hidden">
      {!isDesktop ? (
        <div className="h-full overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            <Sidebar
              jobs={sidebarJobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
            />
            <ResumeForm data={currentResume} onChange={handleResumeChange} />
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
                jobs={sidebarJobs}
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
              <ResumeForm data={currentResume} onChange={handleResumeChange} />
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
