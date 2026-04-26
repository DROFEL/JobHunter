import { createFileRoute } from "@tanstack/react-router"
import type {} from "@/routeTree.gen.ts"
import { JobsCatalogPage } from "@/components/jobs-catalog/index.tsx"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return <JobsCatalogPage />
}
