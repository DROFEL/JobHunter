import { http, HttpResponse } from "msw"

import { db } from "@/mocks/data.ts"
import type { ResumeTemplateDTO } from "@/api/schemas/resumeTemplate.ts"

export const resumeTemplatesHandlers = [
  http.get("/api/resume-templates", () => {
    return HttpResponse.json(db.templates)
  }),

  http.get("/api/resume-templates/:id", ({ params }) => {
    const template = db.templates.find((t) => t.id === params.id)
    if (!template) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(template)
  }),

  http.post("/api/resume-templates", async ({ request }) => {
    const payload = await request.json() as { name: string; data: ResumeTemplateDTO["data"] }
    const newTemplate: ResumeTemplateDTO = {
      id: crypto.randomUUID(),
      name: payload.name,
      data: payload.data,
    }
    db.templates.push(newTemplate)
    return HttpResponse.json(newTemplate, { status: 201 })
  }),

  http.patch("/api/resume-templates/:id", async ({ params, request }) => {
    const idx = db.templates.findIndex((t) => t.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const payload = await request.json() as { name?: string; data?: ResumeTemplateDTO["data"] }
    if (payload.name !== undefined) db.templates[idx].name = payload.name
    if (payload.data !== undefined) db.templates[idx].data = payload.data
    return HttpResponse.json(db.templates[idx])
  }),

  http.delete("/api/resume-templates/:id", ({ params }) => {
    const idx = db.templates.findIndex((t) => t.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    db.templates.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
