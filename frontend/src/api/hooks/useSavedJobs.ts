import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/api/client.ts"
import {
  jobResumeSchema,
  paginatedJobsSchema,
  savedJobSchema,
  type JobResumeDTO,
  type PaginatedJobsDTO,
  type SavedJobDTO,
} from "@/api/schemas/savedJob.ts"

const ENDPOINT = "/jobs"

export interface JobsQueryParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  saved_only?: boolean
  sort_by?: string
  sort_order?: "asc" | "desc"
}

const savedJobsKeys = {
  all:    ()                        => ["savedJobs"] as const,
  lists:  ()                        => [...savedJobsKeys.all(), "list"] as const,
  list:   (params: JobsQueryParams) => [...savedJobsKeys.lists(), params] as const,
  detail: (id: string)              => [...savedJobsKeys.all(), "detail", id] as const,
}

// Updates every cached page that contains the mutated job in-place.
function syncSavedJobsListCache(queryClient: ReturnType<typeof useQueryClient>, updatedJob: SavedJobDTO) {
  queryClient.setQueriesData<PaginatedJobsDTO>(
    { queryKey: savedJobsKeys.lists() },
    (data) => data
      ? { ...data, items: data.items.map((j) => j.id === updatedJob.id ? updatedJob : j) }
      : data,
  )
}

/** Fetch a paginated, filtered, sorted list of jobs. */
export function useSavedJobs(params: JobsQueryParams = {}) {
  return useQuery({
    queryKey: savedJobsKeys.list(params),
    queryFn: () => api.get(ENDPOINT, paginatedJobsSchema, params as Record<string, string | number | boolean | undefined>),
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

/** Create a new saved job. Invalidates all list caches. */
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

/** Update the resume content of a saved job. */
export function useUpdateSavedJobResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resume }: { id: string; resume: JobResumeDTO }) =>
      api.patch(`${ENDPOINT}/${id}/resume`, savedJobSchema, { resume }),
    onSuccess: (updatedJob) => {
      syncSavedJobsListCache(queryClient, updatedJob)
      queryClient.setQueryData(savedJobsKeys.detail(updatedJob.id), updatedJob)
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

/** Toggle the saved flag on a job. */
export function useToggleSavedJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      api.patch(`${ENDPOINT}/${id}`, savedJobSchema, { saved }),
    onSuccess: (updatedJob) => {
      syncSavedJobsListCache(queryClient, updatedJob)
      queryClient.setQueryData(savedJobsKeys.detail(updatedJob.id), updatedJob)
    },
  })
}

/** Delete a saved job. Invalidates all list caches. */
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
export { jobResumeSchema, paginatedJobsSchema, savedJobSchema }
export type { JobResumeDTO, PaginatedJobsDTO, SavedJobDTO }
