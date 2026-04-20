import { createFileRoute } from "@tanstack/react-router"
import type {} from "@/routeTree.gen.ts"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div/>
  )
}
