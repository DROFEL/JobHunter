import { z } from "zod"

const educationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  year: z.string(),
})

// Mirrors profile settings data used across the app.
export const profileSettingsSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  github: z.string(),
  linkedin: z.string(),
  skillPool: z.array(z.string()),
  education: z.array(educationItemSchema),
})

export type ProfileSettingsDTO = z.infer<typeof profileSettingsSchema>
