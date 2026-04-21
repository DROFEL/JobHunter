import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/api/client.ts"
import { resumeTemplateSchema, type ResumeTemplateDTO } from "@/api/schemas/resumeTemplate.ts"
import type { JobResumeDTO } from "@/api/schemas/savedJob.ts"

const ENDPOINT = "/resume-templates"

const resumeTemplatesKeys = {
  all: () => ["resumeTemplates"] as const,
  lists: () => [...resumeTemplatesKeys.all(), "list"] as const,
  detail: (id: string) => [...resumeTemplatesKeys.all(), "detail", id] as const,
}

export function useResumeTemplates() {
  return useQuery({
    queryKey: resumeTemplatesKeys.lists(),
    queryFn: () => api.get(ENDPOINT, z.array(resumeTemplateSchema)),
  })
}

export function useCreateResumeTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; data: JobResumeDTO }) =>
      api.post(ENDPOINT, resumeTemplateSchema, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeTemplatesKeys.lists() })
    },
  })
}

export function useUpdateResumeTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, data }: { id: string; name?: string; data?: JobResumeDTO }) =>
      api.patch(`${ENDPOINT}/${id}`, resumeTemplateSchema, { name, data }),
    onSuccess: (updated) => {
      queryClient.setQueryData<ResumeTemplateDTO[] | undefined>(
        resumeTemplatesKeys.lists(),
        (templates) => templates?.map((t) => (t.id === updated.id ? updated : t)) ?? templates,
      )
      queryClient.setQueryData(resumeTemplatesKeys.detail(updated.id), updated)
    },
  })
}

export function useDeleteResumeTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`${ENDPOINT}/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: resumeTemplatesKeys.lists() })
      queryClient.removeQueries({ queryKey: resumeTemplatesKeys.detail(id) })
    },
  })
}

export { resumeTemplateSchema }
export type { ResumeTemplateDTO }
