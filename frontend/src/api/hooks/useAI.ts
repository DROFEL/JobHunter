import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@/api/client.ts"

const aiGenerateResponseSchema = z.object({
  result: z.string(),
})

export type AICallType = "job_summary" | "resume_summary" | "work_experience"

interface AIGenerateRequest {
  call_type: AICallType
  prompt: string
  context?: string
  url?: string
}

export function useAIGenerate() {
  return useMutation({
    mutationFn: (body: AIGenerateRequest) =>
      api.post("/ai/generate", aiGenerateResponseSchema, body),
  })
}
