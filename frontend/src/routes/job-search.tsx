import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/job-search")({
  component: JobSearchPage,
})

function JobSearchPage() {
  return (
    <div/>
  )
}
