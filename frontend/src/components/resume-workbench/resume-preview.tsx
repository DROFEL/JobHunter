import { Download, Link as LinkIcon, Mail, Phone } from "lucide-react"

import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"

interface ResumePreviewProps {
  data: ResumeData
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function ResumePreview({ data }: ResumePreviewProps) {
  function handleDownload() {
    window.print()
  }

  const githubUrl = normalizeExternalUrl(data.github)
  const linkedinUrl = normalizeExternalUrl(data.linkedin)
  const hasWorkExperience = data.experiences.some((experience) =>
    experience.company.trim()
    || experience.duration.trim()
    || experience.points.some((point) => point.text.trim()),
  )
  const hasSkillTypes = data.skillTypes.some((skillType) =>
    skillType.name.trim() || skillType.skills.length > 0,
  )

  return (
    <Card className="min-h-full overflow-hidden">
      <CardHeader className="no-print border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Resume Preview</CardTitle>
            <CardDescription>Live output updates as you tailor each section</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{data.targetPosition || "General application"}</Badge>
            <Button type="button" onClick={handleDownload}>
              <Download className="size-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="print-shell bg-accent/20 p-4 sm:p-6">
        <div className="print-area mx-auto flex min-h-[11in] w-full max-w-[8.5in] flex-col rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/10 sm:p-12">
          <div className="mb-8 border-b border-slate-200 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{data.name || "Your Name"}</h1>
                <p className="mt-2 text-lg font-medium text-sky-700">{data.position || data.targetPosition || "Target Position"}</p>
                {data.targetCompany ? (
                  <p className="mt-2 text-sm text-slate-500">Tailored for {data.targetCompany}</p>
                ) : null}
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>{data.email || "email@example.com"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>{data.phone || "Phone Number"}</span>
                </div>
                {githubUrl ? (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4" />
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:underline">
                      GitHub
                    </a>
                  </div>
                ) : null}
                {linkedinUrl ? (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4" />
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-700 hover:underline">
                      LinkedIn
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {data.summary ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Professional Summary</h2>
              <p className="text-sm leading-7 text-slate-700">{data.summary}</p>
            </section>
          ) : null}

          {hasWorkExperience ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Work Experience</h2>
              <div className="space-y-5">
                {data.experiences.map((experience) => (
                  experience.company.trim()
                    || experience.duration.trim()
                    || experience.points.some((point) => point.text.trim())
                    ? (
                        <div key={experience.id}>
                          <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <h3 className="text-lg font-semibold text-slate-900">{experience.company || "Company Name"}</h3>
                            <p className="text-sm text-slate-500">{experience.duration || "Duration"}</p>
                          </div>

                          <ul className="mt-4 space-y-3">
                            {experience.points.map((point) => (
                              point.text.trim() ? (
                                <li key={point.id} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                                  <span className="mt-2 size-2 rounded-full bg-sky-700" />
                                  <span className="flex-1">{point.text}</span>
                                </li>
                              ) : null
                            ))}
                          </ul>
                        </div>
                      )
                    : null
                ))}
              </div>
            </section>
          ) : null}

          {data.education.some((item) => item.school || item.degree || item.year) ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Education</h2>
              <div className="space-y-4">
                {data.education.map((item) => (
                  item.school || item.degree || item.year ? (
                    <div key={item.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">{item.school || "Institution"}</h3>
                        <p className="text-sm text-slate-500">{item.year}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{item.degree}</p>
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          ) : null}

          {data.projects.some((project) => project.name || project.description) ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((project) => (
                  project.name || project.description ? (
                    <div key={project.id}>
                      <h3 className="text-base font-semibold text-slate-900">{project.name || "Project"}</h3>
                      {project.description ? <p className="mt-1 text-sm leading-7 text-slate-700">{project.description}</p> : null}
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          ) : null}

          {hasSkillTypes ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Skills</h2>
              <div className="space-y-4">
                {data.skillTypes.map((skillType) => (
                  skillType.name.trim() || skillType.skills.length > 0 ? (
                    <div key={skillType.id}>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">
                        {skillType.name || "Skill Type"}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skillType.skills.map((skill) => (
                          skill.trim() ? (
                            <span
                              key={`${skillType.id}-${skill}`}
                              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800"
                            >
                              {skill}
                            </span>
                          ) : null
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
