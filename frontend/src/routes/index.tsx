import { Navigate, createFileRoute } from "@tanstack/react-router"
import type {} from "@/routeTree.gen.ts"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  return <Navigate to="/resume-builder" />
}
