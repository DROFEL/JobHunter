import { http, HttpResponse } from "msw"

import { db } from "@/mocks/data.ts"

export const profileHandlers = [
  http.get("/api/users", () => {
    return HttpResponse.json({
      user_id: "1",
      data: db.profile,
    })
  }),

  http.post("/api/users", async ({ request }) => {
    const payload = await request.json() as { data: typeof db.profile }
    db.profile = payload.data
    return HttpResponse.json({
      user_id: "1",
      data: db.profile,
    })
  }),
]
