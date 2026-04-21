import { setupWorker } from "msw/browser"

import { aiHandlers } from "@/mocks/handlers/ai.ts"
import { profileHandlers } from "@/mocks/handlers/profile.ts"
import { savedJobsHandlers } from "@/mocks/handlers/savedJobs.ts"
import { resumeTemplatesHandlers } from "@/mocks/handlers/resumeTemplates.ts"

export const worker = setupWorker(...savedJobsHandlers, ...profileHandlers, ...resumeTemplatesHandlers, ...aiHandlers)
