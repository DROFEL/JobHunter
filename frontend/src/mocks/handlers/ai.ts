import { http, HttpResponse } from "msw"

export const aiHandlers = [
  http.post("/api/ai/generate", async ({ request }) => {
    const body = await request.json() as { prompt?: string }
    return HttpResponse.json({ result: `[stub] Generated for: ${String(body.prompt ?? "").slice(0, 80)}` })
  }),
]
