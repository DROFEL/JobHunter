import { http, HttpResponse } from "msw"
import { db } from "@/mocks/data.ts"

export const savedJobsHandlers = [
  http.get("/api/jobs", () => {
    return HttpResponse.json(db.jobs)
  }),

  http.get("/api/jobs/:id", ({ params }) => {
    const id = String(params.id)
    const job = db.jobs.find((j) => j.id === id)

    if (!job) {
      return new Response(null, { status: 404 })
    }

    return HttpResponse.json(job)
  }),

  http.post("/api/jobs", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newJob = {
      ...body,
      id: crypto.randomUUID(),
    } as typeof db.jobs[number]

    db.jobs.push(newJob)

    return Response.json(newJob, { status: 201 })
  }),

  http.patch("/api/jobs/:id/resume", async ({ params, request }) => {
    const id = String(params.id)
    const index = db.jobs.findIndex((j) => j.id === id)

    if (index < 0) {
      return new Response(null, { status: 404 })
    }

    const { resume } = (await request.json()) as {
      resume: typeof db.jobs[number]["resume"]
    }

    db.jobs[index] = {
      ...db.jobs[index],
      title: resume.targetPosition || resume.position || db.jobs[index].title,
      company: resume.targetCompany || db.jobs[index].company,
      resume,
    }

    return HttpResponse.json(db.jobs[index])
  }),

  http.patch("/api/jobs/:id", async ({ params, request }) => {
    const id = String(params.id)
    const index = db.jobs.findIndex((j) => j.id === id)

    if (index < 0) {
      return new Response(null, { status: 404 })
    }

    const patch = (await request.json()) as Partial<typeof db.jobs[number]>

    db.jobs[index] = { ...db.jobs[index], ...patch }

    return HttpResponse.json(db.jobs[index])
  }),

  http.delete("/api/jobs/:id", ({ params }) => {
    const id = String(params.id)
    const index = db.jobs.findIndex((j) => j.id === id)

    if (index < 0) {
      return new Response(null, { status: 404 })
    }

    db.jobs.splice(index, 1)

    return new Response(null, { status: 204 })
  }),
]
