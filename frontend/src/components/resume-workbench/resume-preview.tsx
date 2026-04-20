import { Download } from "lucide-react"
import type { ResumeData } from "@/components/resume-workbench/types.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { useRef } from "react";
import { useReactToPrint } from "react-to-print"

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

function formatLinkLabel(value: string, fallback: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  return trimmed
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-black pb-0.5">
      <h2 className="text-[11.5pt] font-bold uppercase leading-none tracking-tight">{children}</h2>
    </div>
  )
}

export function ResumePreview({ data }: ResumePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handleDownload = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.name || "resume"}`,
  })

  const githubUrl = normalizeExternalUrl(data.github)
  const linkedinUrl = normalizeExternalUrl(data.linkedin)
  const hasWorkExperience = data.experiences.some((experience) =>
    experience.company.trim()
    || experience.duration.trim()
    || experience.points.some((point) => point.text.trim()),
  )
  const hasSkillTypes = data.skillTypes.some((skillType) =>
    skillType.name.trim() || skillType.skills.some((skill) => skill.trim()),
  )
  const hasEducation = data.education.some((item) => item.school.trim() || item.degree.trim() || item.year.trim())
  const hasProjects = data.projects.some((project) => project.name.trim() || project.description.trim())

  return (
    <Card className="min-h-full overflow-hidden">
      <CardHeader className="no-print border-b border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Resume Preview</CardTitle>
            <CardDescription>Formatted to match your current resume layout</CardDescription>
          </div>

          <Button type="button" onClick={handleDownload}>
            <Download className="size-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="print-shell bg-accent/20 p-4 sm:p-6" >
        <div
          ref={printRef}
          className="mx-auto box-border h-[11in] w-[8.5in] bg-white px-[0.3in] py-[0.4in] font-[Arial] text-[11pt] leading-[1.3] text-black shadow-sm"
        >
          <header className="text-center">
            <h1 className="text-[20pt] font-bold leading-none">{data.name || "Your Name"}</h1>
            <p className="mt-1 text-[12pt] font-normal">{data.position || data.targetPosition || "Software Engineer"}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-[10.5pt]">
              <span>Toronto, ON</span>
              <span>|</span>
              <span>{data.phone || "+1 (555) 555-5555"}</span>
              <span>|</span>
              <span>{data.email || "email@example.com"}</span>
              {linkedinUrl ? (
                <>
                  <span>|</span>
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {formatLinkLabel(data.linkedin, "LinkedIn")}
                  </a>
                </>
              ) : null}
              {githubUrl ? (
                <>
                  <span>|</span>
                  <a href={githubUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {formatLinkLabel(data.github, "GitHub")}
                  </a>
                </>
              ) : null}
            </div>
            {data.summary.trim() ? (
              <p className="mt-3 text-[11pt] leading-[1.3] text-left">{data.summary}</p>
            ) : null}
          </header>

          {hasEducation ? (
            <section className="mt-4">
              <SectionTitle>Education:</SectionTitle>
              <div className="mt-1 space-y-1">
                {data.education.map((item) => (
                  item.school.trim() || item.degree.trim() || item.year.trim() ? (
                    <div key={item.id} className="flex items-baseline justify-between gap-4">
                      <div>
                        <span className="font-bold">{item.school || "Institution"}</span>
                        {item.degree ? <span>, {item.degree}</span> : null}
                      </div>
                      <span className="font-bold">{item.year}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          ) : null}

          {hasSkillTypes ? (
            <section className="mt-4">
              <SectionTitle>Skills:</SectionTitle>
              <div className="mt-1 space-y-1">
                {data.skillTypes.map((skillType) => (
                  skillType.name.trim() || skillType.skills.some((skill) => skill.trim()) ? (
                    <p key={skillType.id}>
                      <span className="font-bold">{skillType.name || "Skills"}: </span>
                      <span>{skillType.skills.filter((skill) => skill.trim()).join(", ")}</span>
                    </p>
                  ) : null
                ))}
              </div>
            </section>
          ) : null}

          {hasWorkExperience ? (
            <section className="mt-4">
              <SectionTitle>Work Experience:</SectionTitle>
              <div className="mt-1 space-y-3">
                {data.experiences.map((experience) => (
                  experience.company.trim()
                    || experience.duration.trim()
                    || experience.points.some((point) => point.text.trim())
                    ? (
                      <article key={experience.id}>
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="font-bold">{experience.company || "Company / Role"}</div>
                          <div className="font-bold">{experience.duration}</div>
                        </div>
                        <ul className="mt-1 space-y-1 pl-5">
                          {experience.points.map((point) => (
                            point.text.trim() ? (
                              <li key={point.id} className="list-disc">
                                {point.text}
                              </li>
                            ) : null
                          ))}
                        </ul>
                      </article>
                    )
                    : null
                ))}
              </div>
            </section>
          ) : null}

          {hasProjects ? (
            <section className="mt-4">
              <SectionTitle>Projects and Extracurricular Activities:</SectionTitle>
              <ul className="mt-1 space-y-1 pl-5">
                {data.projects.map((project) => (
                  project.name.trim() || project.description.trim() ? (
                    <li key={project.id} className="list-disc">
                      <span className="font-bold">{project.name || "Project"}</span>
                      {project.description ? <span>: {project.description}</span> : null}
                    </li>
                  ) : null
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
