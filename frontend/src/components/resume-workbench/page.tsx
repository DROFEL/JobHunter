import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import {
  defaultProfileSettings,
  useProfileSettingsQuery,
} from "@/api/hooks/useProfileSettings.ts"
import { ResumeForm } from "@/components/resume-workbench/resume-form.tsx"
import { ResumePreview } from "@/components/resume-workbench/resume-preview.tsx"
import { Sidebar } from "@/components/resume-workbench/sidebar.tsx"
import type { JobResume, JobStatus, ResumeData, SavedJob } from "@/components/resume-workbench/types.ts"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { useResumeTemplates } from "@/api/hooks/useResumeTemplates.ts"
import { useSavedJobs, useCreateSavedJob, useUpdateSavedJob, useUpdateSavedJobResume } from "@/api/hooks/useSavedJobs.ts"

const DEFAULT_PANEL_SIZES = [18, 42, 40] as const
const MIN_PANEL_SIZES = [16, 28, 24] as const
const DESKTOP_BREAKPOINT = 1280
const EMPTY_RESUME: JobResume = {
  position: "",
  summary: "",
  targetPosition: "",
  targetCompany: "",
  jobPostingLink: "",
  aiJobSummary: "",
  experiences: [],
  projects: [],
  skillTypes: [],
  enabledLanguageIds: [],
}

function seedResumeFromJob(job: SavedJob): JobResume {
  return job.resume ?? {
    ...EMPTY_RESUME,
    targetPosition: job.title,
    targetCompany: job.company,
    jobPostingLink: job.url,
    aiJobSummary: job.summary,
  }
}

export function ResumeWorkbenchPage() {
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { data: jobs = [] } = useSavedJobs()
  const { data: templates = [] } = useResumeTemplates()
  const { mutate: saveResume } = useUpdateSavedJobResume()
  const { mutate: createJob } = useCreateSavedJob()
  const { mutate: updateJob } = useUpdateSavedJob()

  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [editingResume, setEditingResume] = useState<JobResume | null>(null)
  const [editingMeta, setEditingMeta] = useState<{ status?: JobStatus; employmentType?: string; salary?: string; location?: string; deadline?: string }>({})
  const [isDesktop, setIsDesktop] = useState(false)

  // Seed selection once when jobs first arrive
  const initialized = useRef(false)
  useEffect(() => {
    if (jobs.length > 0 && !initialized.current) {
      initialized.current = true
      setSelectedJobId(jobs[0].id)
      setEditingResume(seedResumeFromJob(jobs[0]))
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
  const hasJobs = jobs.length > 0

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
          ...editingMeta,
        }
      }),
    [editingMeta, editingResume, jobs, selectedJobId],
  )

  function handleSelectJob(job: SavedJob) {
    if (editingResume && selectedJobId) {
      saveResume({ id: selectedJobId, resume: editingResume })
    }
    setSelectedJobId(job.id)
    setEditingResume(seedResumeFromJob(job))
    setEditingMeta({})
  }

  function handleResumeChange(resume: JobResume) {
    setEditingResume(resume)
  }

  function handleJobMetaChange(fields: { status?: JobStatus; employmentType?: string; salary?: string; location?: string; deadline?: string }) {
    setEditingMeta((prev) => ({ ...prev, ...fields }))
    if (selectedJobId) {
      updateJob({ id: selectedJobId, ...fields })
    }
  }

  function handleCreateFromTemplate(templateId: string | null) {
    const template = templateId ? templates.find((t) => t.id === templateId) : null
    const resume: JobResume = template
      ? { ...(template.data as JobResume), targetPosition: "", targetCompany: "", jobPostingLink: "", aiJobSummary: "" }
      : EMPTY_RESUME

    createJob(
      {
        title: template?.data.position || "New Job",
        company: "",
        location: "",
        posted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        salary: "",
        employmentType: "",
        summary: "",
        url: "",
        deadline: "",
        saved: true,
        status: "Found",
        resume,
      },
      {
        onSuccess: (newJob) => {
          setSelectedJobId(newJob.id)
          setEditingResume(seedResumeFromJob(newJob))
        },
      },
    )
  }

  const currentResume = editingResume ?? (selectedJob ? seedResumeFromJob(selectedJob) : EMPTY_RESUME)

  const jobMeta = selectedJob
    ? {
        status: (editingMeta.status ?? selectedJob.status) as JobStatus,
        employmentType: editingMeta.employmentType ?? selectedJob.employmentType,
        salary: editingMeta.salary ?? selectedJob.salary,
        location: editingMeta.location ?? selectedJob.location,
        deadline: editingMeta.deadline ?? selectedJob.deadline,
      }
    : undefined

  const previewData = useMemo<ResumeData>(
    () => ({
      ...currentResume,
      profile: settings.profile,
      education: settings.education,
      languages: settings.languages.filter((lang) =>
        currentResume.enabledLanguageIds.includes(lang.id),
      ),
    }),
    [currentResume, settings],
  )

  function renderDisabledPanel(children: ReactNode, message: string) {
    return (
      <div className="relative min-h-full">
        <div className={hasJobs ? "" : "pointer-events-none opacity-45 grayscale"}>
          {children}
        </div>
        {!hasJobs ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-xs rounded-xl border border-border/60 bg-background/90 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
              {message}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <main className="h-full min-h-0 overflow-hidden">
      {!isDesktop ? (
        <div className="h-full overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            <Sidebar
              jobs={sidebarJobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
              onCreateFromTemplate={handleCreateFromTemplate}
            />
            {renderDisabledPanel(
              <ResumeForm data={currentResume} onChange={handleResumeChange} selectedJobId={selectedJobId} scrapeStatus={selectedJob?.scrapeStatus ?? null} jobMeta={jobMeta} onJobMetaChange={handleJobMetaChange} />,
              "Add or save a job posting to start editing a resume.",
            )}
            {renderDisabledPanel(
              <ResumePreview data={previewData} />,
              "Resume preview becomes available once a job posting is selected.",
            )}
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
                onCreateFromTemplate={handleCreateFromTemplate}
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
              {renderDisabledPanel(
                <ResumeForm data={currentResume} onChange={handleResumeChange} selectedJobId={selectedJobId} scrapeStatus={selectedJob?.scrapeStatus ?? null} jobMeta={jobMeta} onJobMetaChange={handleJobMetaChange} />,
                "Add or save a job posting to start editing a resume.",
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={DEFAULT_PANEL_SIZES[2]}
            minSize={MIN_PANEL_SIZES[2]}
            className="min-w-0"
          >
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              {renderDisabledPanel(
                <ResumePreview data={previewData} />,
                "Resume preview becomes available once a job posting is selected.",
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  )
}
