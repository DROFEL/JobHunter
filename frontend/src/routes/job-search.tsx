import { createFileRoute } from "@tanstack/react-router"
import { BriefcaseBusiness } from "lucide-react"

import type {} from "@/routeTree.gen.ts"
import { PlaceholderPage } from "@/components/app/placeholder-page.tsx"

export const Route = createFileRoute("/job-search")({
  component: JobSearchPage,
})

function JobSearchPage() {
  return (
    <PlaceholderPage
      title="Job Search"
      description="Track opportunities, compare roles, and keep your shortlist actionable while you tailor documents from one place."
      icon={BriefcaseBusiness}
      highlights={["Saved Filters", "Role Tracking", "Application Timeline"]}
    />
  )
}
