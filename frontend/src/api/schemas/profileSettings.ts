import { z } from "zod"

export const educationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  year: z.string(),
  description: z.string().default(""),
})

export const languageItemSchema = z.object({
  id: z.string(),
  language: z.string(),
  level: z.string(),
})

export const profileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  github: z.string(),
  linkedin: z.string(),
})

export const userDataSchema = z.object({
  profile: profileSchema,
  education: z.array(educationItemSchema),
  skillPool: z.array(z.string()),
  languages: z.array(languageItemSchema).default([]),
  experienceContext: z.string().default(""),
  applicationContext: z.string().default(""),
})

export const userUpsertRequestSchema = z.object({
  data: userDataSchema,
})

export const userResponseSchema = z.object({
  user_id: z.string(),
  data: userDataSchema.nullable(),
})

export type EducationItemDTO = z.infer<typeof educationItemSchema>
export type LanguageItemDTO = z.infer<typeof languageItemSchema>
export type ProfileDTO = z.infer<typeof profileSchema>
export type ProfileSettingsDTO = z.infer<typeof userDataSchema>
export type UserUpsertRequestDTO = z.infer<typeof userUpsertRequestSchema>
export type UserResponseDTO = z.infer<typeof userResponseSchema>
