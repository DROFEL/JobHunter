import { createFileRoute } from "@tanstack/react-router"
import { LayoutDashboard } from "lucide-react"

import type {} from "@/routeTree.gen.ts"
import { PlaceholderPage } from "@/components/app/placeholder-page.tsx"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Get a clear view of your weekly momentum, interview pipeline, and where your resume iterations are improving results."
      icon={LayoutDashboard}
      highlights={["Application Metrics", "Interview Funnel", "Weekly Goals"]}
    />
  )
}
