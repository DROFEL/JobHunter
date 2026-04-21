import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/api/client.ts"
import {
  jobResumeSchema,
  savedJobSchema,
  type JobResumeDTO,
  type SavedJobDTO,
} from "@/api/schemas/savedJob.ts"

const ENDPOINT = "/jobs"

// Key factory — keeps all query keys for this domain in one place
const savedJobsKeys = {
  all: () => ["savedJobs"] as const,
  lists: () => [...savedJobsKeys.all(), "list"] as const,
  detail: (id: string) => [...savedJobsKeys.all(), "detail", id] as const,
}

function syncSavedJobsListCache(queryClient: ReturnType<typeof useQueryClient>, updatedJob: SavedJobDTO) {
  queryClient.setQueryData<SavedJobDTO[] | undefined>(savedJobsKeys.lists(), (jobs) =>
    jobs?.map((job) => (job.id === updatedJob.id ? updatedJob : job)) ?? jobs,
  )
}

/** Fetch all saved jobs. */
export function useSavedJobs() {
  return useQuery({
    queryKey: savedJobsKeys.lists(),
    queryFn: () => api.get(ENDPOINT, z.array(savedJobSchema)),
  })
}

/** Fetch a single saved job by ID. */
export function useSavedJob(id: string) {
  return useQuery({
    queryKey: savedJobsKeys.detail(id),
    queryFn: () => api.get(`${ENDPOINT}/${id}`, savedJobSchema),
    enabled: Boolean(id),
  })
}

/** Create a new saved job. Invalidates the list on success. */
export function useCreateSavedJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<SavedJobDTO, "id">) =>
      api.post(ENDPOINT, savedJobSchema, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.lists() })
    },
  })
}

/** Update the resume content of a saved job. Updates list and detail caches. */
export function useUpdateSavedJobResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resume }: { id: string; resume: JobResumeDTO }) =>
      api.patch(`${ENDPOINT}/${id}/resume`, savedJobSchema, { resume }),
    onSuccess: (updatedJob) => {
      syncSavedJobsListCache(queryClient, updatedJob)
      queryClient.setQueryData(savedJobsKeys.detail(updatedJob.id), updatedJob)
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.lists() })
    },
  })
}

/** Patch arbitrary top-level fields on a saved job. */
export function useUpdateSavedJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...fields }: { id: string } & Partial<Omit<SavedJobDTO, "id">>) =>
      api.patch(`${ENDPOINT}/${id}`, savedJobSchema, fields),
    onSuccess: (updatedJob) => {
      syncSavedJobsListCache(queryClient, updatedJob)
      queryClient.setQueryData(savedJobsKeys.detail(updatedJob.id), updatedJob)
    },
  })
}

/** Toggle the saved flag on a job. Updates list and detail caches. */
export function useToggleSavedJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      api.patch(`${ENDPOINT}/${id}`, savedJobSchema, { saved }),
    onSuccess: (updatedJob) => {
      syncSavedJobsListCache(queryClient, updatedJob)
      queryClient.setQueryData(savedJobsKeys.detail(updatedJob.id), updatedJob)
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.lists() })
    },
  })
}

/** Delete a saved job. Removes from list and clears detail cache. */
export function useDeleteSavedJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`${ENDPOINT}/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: savedJobsKeys.lists() })
      queryClient.removeQueries({ queryKey: savedJobsKeys.detail(id) })
    },
  })
}

// Re-export schemas and types so consumers import from a single place
export { jobResumeSchema, savedJobSchema }
export type { JobResumeDTO, SavedJobDTO }
