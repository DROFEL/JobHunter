import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/api/client.ts"
import { searchConfigSchema, type SearchConfigDTO } from "@/api/schemas/searchConfig.ts"

const ENDPOINT = "/searches"

const keys = {
  all: () => ["searchConfigs"] as const,
  lists: () => [...keys.all(), "list"] as const,
}

function syncListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updated: SearchConfigDTO,
) {
  queryClient.setQueryData<SearchConfigDTO[]>(keys.lists(), (prev) =>
    prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev,
  )
}

export function useSearchConfigs() {
  return useQuery({
    queryKey: keys.lists(),
    queryFn: () => api.get(ENDPOINT, z.array(searchConfigSchema)),
    refetchInterval: (query) => {
      const data = query.state.data
      if (Array.isArray(data) && data.some((c) => c.status === "Running")) {
        return 3000
      }
      return false
    },
  })
}

export function useCreateSearchConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { board: string; params: Record<string, string>; results_wanted: number }) =>
      api.post(ENDPOINT, searchConfigSchema, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() })
    },
  })
}

export function useDeleteSearchConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`${ENDPOINT}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() })
    },
  })
}

export function useDispatchSearch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`${ENDPOINT}/${id}/dispatch`, searchConfigSchema, {}),
    onSuccess: (updated) => {
      syncListCache(queryClient, updated)
    },
  })
}
