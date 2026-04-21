import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import {
  defaultProfileSettings,
  useProfileSettingsQuery,
} from "@/api/hooks/useProfileSettings.ts"
import {
  useResumeTemplates,
  useCreateResumeTemplate,
  useUpdateResumeTemplate,
  useDeleteResumeTemplate,
  type ResumeTemplateDTO,
} from "@/api/hooks/useResumeTemplates.ts"
import { ResumeContentForm } from "@/components/resume-workbench/resume-content-form.tsx"
import { ResumePreview } from "@/components/resume-workbench/resume-preview.tsx"
import type { JobResume, ResumeData } from "@/components/resume-workbench/types.ts"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { TemplateSidebar } from "@/components/resume-templates/sidebar.tsx"

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

type EditingTemplate = {
  id: string | null
  name: string
  data: JobResume
}

export function ResumeTemplatesPage() {
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { data: templates = [] } = useResumeTemplates()
  const { mutate: createTemplate } = useCreateResumeTemplate()
  const { mutate: updateTemplate } = useUpdateResumeTemplate()
  const { mutate: deleteTemplate } = useDeleteResumeTemplate()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditingTemplate | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const initialized = useRef(false)
  useEffect(() => {
    if (templates.length > 0 && !initialized.current) {
      initialized.current = true
      const first = templates[0]
      setSelectedId(first.id)
      setEditing({ id: first.id, name: first.name, data: first.data as JobResume })
    }
  }, [templates])

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  function persistCurrent() {
    if (!editing || !isDirty) return
    if (editing.id) {
      updateTemplate({ id: editing.id, name: editing.name, data: editing.data })
    } else {
      createTemplate(
        { name: editing.name || "Untitled Template", data: editing.data },
        {
          onSuccess: (created) => {
            setSelectedId(created.id)
            setEditing({ id: created.id, name: created.name, data: created.data as JobResume })
          },
        },
      )
    }
    setIsDirty(false)
  }

  function handleSelectTemplate(template: ResumeTemplateDTO) {
    persistCurrent()
    setSelectedId(template.id)
    setEditing({ id: template.id, name: template.name, data: template.data as JobResume })
    setIsDirty(false)
  }

  function handleNew() {
    persistCurrent()
    setSelectedId(null)
    setEditing({ id: null, name: "New Template", data: { ...EMPTY_RESUME } })
    setIsDirty(true)
  }

  function handleDelete(id: string) {
    deleteTemplate(id, {
      onSuccess: () => {
        if (selectedId === id) {
          const remaining = templates.filter((t) => t.id !== id)
          if (remaining.length > 0) {
            const next = remaining[0]
            setSelectedId(next.id)
            setEditing({ id: next.id, name: next.name, data: next.data as JobResume })
          } else {
            setSelectedId(null)
            setEditing(null)
          }
          setIsDirty(false)
        }
      },
    })
  }

  function handleNameChange(name: string) {
    setEditing((prev) => prev ? { ...prev, name } : prev)
    setIsDirty(true)
  }

  function handleResumeChange(data: JobResume) {
    setEditing((prev) => prev ? { ...prev, data } : prev)
    setIsDirty(true)
  }

  function handleSave() {
    persistCurrent()
  }

  const currentResume = editing?.data ?? EMPTY_RESUME

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

  const hasTemplates = templates.length > 0 || editing !== null

  function renderDisabledPanel(children: ReactNode, message: string) {
    const disabled = !hasTemplates
    return (
      <div className="relative min-h-full">
        <div className={disabled ? "pointer-events-none opacity-45 grayscale" : ""}>{children}</div>
        {disabled ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-xs rounded-xl border border-border/60 bg-background/90 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
              {message}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const formPanel = (
    <div className="space-y-3">
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="mb-1">Edit Template</CardTitle>
              <CardDescription>Base resume content reused across job applications</CardDescription>
              <Input
                className="mt-3"
                placeholder="Template name…"
                value={editing?.name ?? ""}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              size="sm"
            >
              Save
            </Button>
          </div>
        </CardHeader>
      </Card>
      <ResumeContentForm data={currentResume} onChange={handleResumeChange} />
    </div>
  )

  return (
    <main className="h-full min-h-0 overflow-hidden">
      {!isDesktop ? (
        <div className="h-full overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            <TemplateSidebar
              templates={templates}
              selectedId={selectedId}
              onSelect={handleSelectTemplate}
              onNew={handleNew}
              onDelete={handleDelete}
            />
            {renderDisabledPanel(formPanel, "Create a template to start editing.")}
            {renderDisabledPanel(
              <ResumePreview data={previewData} />,
              "Resume preview becomes available once a template is selected.",
            )}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={DEFAULT_PANEL_SIZES[0]} minSize={MIN_PANEL_SIZES[0]} className="min-w-0">
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              <TemplateSidebar
                templates={templates}
                selectedId={selectedId}
                onSelect={handleSelectTemplate}
                onNew={handleNew}
                onDelete={handleDelete}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={DEFAULT_PANEL_SIZES[1]} minSize={MIN_PANEL_SIZES[1]} className="min-w-0">
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              {renderDisabledPanel(formPanel, "Create a template to start editing.")}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={DEFAULT_PANEL_SIZES[2]} minSize={MIN_PANEL_SIZES[2]} className="min-w-0">
            <div className="workspace-panel h-full min-h-0 overflow-y-auto p-3">
              {renderDisabledPanel(
                <ResumePreview data={previewData} />,
                "Resume preview becomes available once a template is selected.",
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  )
}
