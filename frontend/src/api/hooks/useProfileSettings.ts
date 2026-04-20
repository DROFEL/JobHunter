import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/api/client.ts"
import {
  profileSettingsSchema,
  type ProfileSettingsDTO,
} from "@/api/schemas/profileSettings.ts"

const ENDPOINT = "/profile"

// Key factory — single entry since profile is a singleton resource
const profileSettingsKeys = {
  all: () => ["profileSettings"] as const,
}

const defaultProfileSettings: ProfileSettingsDTO = {
  name: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
  skillPool: [],
  education: [],
}

/** Fetch the current user's profile settings. */
export function useProfileSettingsQuery() {
  return useQuery({
    queryKey: profileSettingsKeys.all(),
    queryFn: () => api.get(ENDPOINT, profileSettingsSchema),
    placeholderData: defaultProfileSettings,
  })
}

/** Partially update profile settings with an optimistic cache update. */
export function useUpdateProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ProfileSettingsDTO>) =>
      api.patch(ENDPOINT, profileSettingsSchema, body),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: profileSettingsKeys.all() })

      const previousSettings = queryClient.getQueryData<ProfileSettingsDTO>(
        profileSettingsKeys.all(),
      )

      if (previousSettings) {
        queryClient.setQueryData(profileSettingsKeys.all(), {
          ...previousSettings,
          ...updates,
        })
      }

      return { previousSettings }
    },
    onError: (_error, _updates, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(profileSettingsKeys.all(), context.previousSettings)
      }
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(profileSettingsKeys.all(), updatedSettings)
    },
  })
}

// Re-export schema and type so consumers import from a single place
export { profileSettingsSchema }
export type { ProfileSettingsDTO }
export { defaultProfileSettings }
