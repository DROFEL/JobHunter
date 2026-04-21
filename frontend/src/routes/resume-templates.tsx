import { createFileRoute } from "@tanstack/react-router"

import { ResumeTemplatesPage } from "@/components/resume-templates/page.tsx"

export const Route = createFileRoute("/resume-templates")({
  component: ResumeTemplatesPage,
})
