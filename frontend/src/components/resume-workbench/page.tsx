import { GripVertical } from "lucide-react"
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react"

import { initialResumeData, savedJobs } from "@/components/resume-workbench/mock-data.ts"
import { useProfileSettings } from "@/components/app/profile-settings-context.tsx"
import { ResumeForm } from "@/components/resume-workbench/resume-form.tsx"
import { ResumePreview } from "@/components/resume-workbench/resume-preview.tsx"
import { Sidebar } from "@/components/resume-workbench/sidebar.tsx"
import type { ResumeData, SavedJob } from "@/components/resume-workbench/types.ts"

const DEFAULT_PANEL_WIDTHS = [18, 42, 40] as const
const MIN_PANEL_PIXELS = [260, 440, 360] as const
const HANDLE_WIDTH = 14
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface ResizeHandleProps {
  ariaLabel: string
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onDoubleClick: () => void
}

function ResizeHandle({ ariaLabel, onPointerDown, onDoubleClick }: ResizeHandleProps) {
  return (
    <div className="no-print hidden h-full xl:flex xl:items-stretch xl:justify-center">
      <button
        type="button"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        className="group relative flex h-full w-[14px] cursor-col-resize touch-none items-center justify-center"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition group-hover:bg-primary/40" />
        <span className="relative z-10 flex h-16 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm transition group-hover:border-primary/30 group-hover:bg-accent">
          <GripVertical className="size-4 text-muted-foreground" />
        </span>
      </button>
    </div>
  )
}

export function ResumeWorkbenchPage() {
  const { profile } = useProfileSettings()
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupResizeRef = useRef<(() => void) | null>(null)
  const [jobs, setJobs] = useState<SavedJob[]>(savedJobs)
  const [selectedJobId, setSelectedJobId] = useState(savedJobs[0]?.id ?? "")
  const [panelWidths, setPanelWidths] = useState<number[]>([...DEFAULT_PANEL_WIDTHS])
  const [resumeData, setResumeData] = useState(() => buildResumeFromJob(savedJobs[0], initialResumeData))

  useEffect(() => {
    return () => {
      cleanupResizeRef.current?.()
    }
  }, [])

  function handleSelectJob(job: SavedJob) {
    setSelectedJobId(job.id)
    setResumeData((currentData) => buildResumeFromJob(job, currentData))
  }

  function handleReorderJobs(nextJobs: SavedJob[]) {
    setJobs(nextJobs)
  }

  function startResize(
    boundary: "left" | "right",
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      return
    }

    const container = containerRef.current

    if (!container) {
      return
    }

    const containerWidth = container.getBoundingClientRect().width - HANDLE_WIDTH * 2

    if (containerWidth <= 0) {
      return
    }

    const startX = event.clientX
    const startWidths = [...panelWidths]
    const totalUnits = startWidths.reduce((sum, width) => sum + width, 0)
    const minUnits = MIN_PANEL_PIXELS.map((pixels) => pixels / containerWidth * totalUnits)

    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaUnits = (moveEvent.clientX - startX) / containerWidth * totalUnits

      if (boundary === "left") {
        const available = startWidths[0] + startWidths[1]
        const nextLeft = clamp(startWidths[0] + deltaUnits, minUnits[0], available - minUnits[1])
        const nextMiddle = available - nextLeft

        setPanelWidths([nextLeft, nextMiddle, startWidths[2]])
        return
      }

      const available = startWidths[1] + startWidths[2]
      const nextMiddle = clamp(startWidths[1] + deltaUnits, minUnits[1], available - minUnits[2])
      const nextRight = available - nextMiddle

      setPanelWidths([startWidths[0], nextMiddle, nextRight])
    }

    const cleanup = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", cleanup)
      cleanupResizeRef.current = null
    }

    cleanupResizeRef.current?.()
    cleanupResizeRef.current = cleanup

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", cleanup, { once: true })
  }

  const desktopGridStyle = useMemo<CSSProperties>(() => ({
    gridTemplateColumns: `minmax(0, ${panelWidths[0]}fr) ${HANDLE_WIDTH}px minmax(0, ${panelWidths[1]}fr) ${HANDLE_WIDTH}px minmax(0, ${panelWidths[2]}fr)`,
  }), [panelWidths])

  const previewData = useMemo<ResumeData>(() => ({
    ...resumeData,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    github: profile.github,
    linkedin: profile.linkedin,
  }), [profile, resumeData])

  return (
    <main className="h-full min-h-0 overflow-hidden">
      <div className="h-full overflow-y-auto px-3 py-3 xl:hidden">
        <div className="space-y-3">
          <Sidebar
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={handleSelectJob}
            onReorderJobs={handleReorderJobs}
          />
          <ResumeForm data={resumeData} onChange={setResumeData} />
          <ResumePreview data={previewData} />
        </div>
      </div>

      <div ref={containerRef} style={desktopGridStyle} className="hidden h-full w-full xl:grid">
        <div className="workspace-panel min-h-0 overflow-y-auto p-3">
          <Sidebar
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={handleSelectJob}
            onReorderJobs={handleReorderJobs}
          />
        </div>

        <ResizeHandle
          ariaLabel="Resize saved jobs and resume form panels"
          onPointerDown={(event) => startResize("left", event)}
          onDoubleClick={() => setPanelWidths([...DEFAULT_PANEL_WIDTHS])}
        />

        <div className="workspace-panel min-h-0 overflow-y-auto p-3">
          <ResumeForm data={resumeData} onChange={setResumeData} />
        </div>

        <ResizeHandle
          ariaLabel="Resize resume form and preview panels"
          onPointerDown={(event) => startResize("right", event)}
          onDoubleClick={() => setPanelWidths([...DEFAULT_PANEL_WIDTHS])}
        />

        <div className="workspace-panel min-h-0 overflow-y-auto p-3">
          <ResumePreview data={previewData} />
        </div>
      </div>
    </main>
  )
}
