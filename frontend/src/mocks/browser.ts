import { setupWorker } from "msw/browser"

import { profileHandlers } from "@/mocks/handlers/profile.ts"
import { savedJobsHandlers } from "@/mocks/handlers/savedJobs.ts"

export const worker = setupWorker(...savedJobsHandlers, ...profileHandlers)
