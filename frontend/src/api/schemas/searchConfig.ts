import { z } from "zod"

export const searchConfigSchema = z.object({
  id: z.string(),
  board: z.string(),
  params: z.record(z.string(), z.string()),
  results_wanted: z.number(),
  status: z.enum(["Idle", "Running", "Complete", "Failed"]),
  scraped_last_run: z.number(),
  scraped_total: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export type SearchConfigDTO = z.infer<typeof searchConfigSchema>
export type SearchStatus = SearchConfigDTO["status"]
export const SEARCH_STATUSES: readonly SearchStatus[] = ["Idle", "Running", "Complete", "Failed"]
