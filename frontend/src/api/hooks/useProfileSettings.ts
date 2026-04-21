import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, ApiError } from "@/api/client.ts"
import {
  userResponseSchema,
  type ProfileSettingsDTO,
} from "@/api/schemas/profileSettings.ts"

const ENDPOINT = "/users"

// Key factory — single entry since profile is a singleton resource
const profileSettingsKeys = {
  all: () => ["profileSettings"] as const,
}

type ProfileSettingsPatch = {
  profile?: Partial<ProfileSettingsDTO["profile"]>
  education?: ProfileSettingsDTO["education"]
  skillPool?: ProfileSettingsDTO["skillPool"]
}

const defaultProfileSettings: ProfileSettingsDTO = {
  profile: {
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
  },
  education: [],
  skillPool: [],
}

/** Fetch the current user's profile settings. */
export function useProfileSettingsQuery() {
  return useQuery({
    queryKey: profileSettingsKeys.all(),
    queryFn: async () => {
      try {
        const response = await api.get(ENDPOINT, userResponseSchema)
        return response.data ?? defaultProfileSettings
      }
      catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return defaultProfileSettings
        }
        throw error
      }
    },
    placeholderData: defaultProfileSettings,
  })
}

function mergeProfileSettings(
  current: ProfileSettingsDTO,
  updates: ProfileSettingsPatch,
): ProfileSettingsDTO {
  return {
    ...current,
    ...updates,
    profile: {
      ...current.profile,
      ...(updates.profile ?? {}),
    },
  }
}

/** Patch profile settings with an optimistic cache update. */
export function useUpdateProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileSettingsPatch) =>
      api.patch(ENDPOINT, userResponseSchema, { data: body }),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: profileSettingsKeys.all() })

      const previousSettings = queryClient.getQueryData<ProfileSettingsDTO>(
        profileSettingsKeys.all(),
      )

      queryClient.setQueryData(
        profileSettingsKeys.all(),
        mergeProfileSettings(previousSettings ?? defaultProfileSettings, updates),
      )

      return { previousSettings }
    },
    onError: (_error, _updates, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(profileSettingsKeys.all(), context.previousSettings)
      }
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(profileSettingsKeys.all(), updatedSettings.data ?? defaultProfileSettings)
    },
  })
}

// Re-export schema and type so consumers import from a single place
export type { ProfileSettingsDTO }
export { defaultProfileSettings }
