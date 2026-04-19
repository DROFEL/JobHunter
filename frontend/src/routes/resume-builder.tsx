import { createFileRoute } from "@tanstack/react-router"

import type {} from "@/routeTree.gen.ts"
import { ResumeWorkbenchPage } from "@/components/resume-workbench/page.tsx"

export const Route = createFileRoute("/resume-builder")({
  component: ResumeBuilderPage,
})

function ResumeBuilderPage() {
  return <ResumeWorkbenchPage />
}
