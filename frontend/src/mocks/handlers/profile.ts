import { http, HttpResponse } from "msw"

import { db } from "@/mocks/data.ts"

export const profileHandlers = [
  http.get("/api/profile", () => {
    return HttpResponse.json(db.profile)
  }),

  http.patch("/api/profile", async ({ request }) => {
    const patch = await request.json() as Partial<typeof db.profile>
    db.profile = { ...db.profile, ...patch }
    return HttpResponse.json(db.profile)
  }),
]
