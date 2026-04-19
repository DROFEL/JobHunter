import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const PROFILE_SETTINGS_STORAGE_KEY = "jobhunter.profile-settings.v1"
const SKILL_POOL_STORAGE_KEY = "jobhunter.skill-pool.v1"

export interface ProfileSettings {
  name: string
  email: string
  phone: string
  github: string
  linkedin: string
}

interface ProfileSettingsContextValue {
  profile: ProfileSettings
  skillPool: string[]
  updateProfile: (updates: Partial<ProfileSettings>) => void
  setSkillPool: (nextSkillPool: string[]) => void
}

const defaultProfileSettings: ProfileSettings = {
  name: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
}

const defaultSkillPool = [
  "React",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "Node.js",
  "Design Systems",
  "Accessibility",
  "Testing",
  "Git",
]

const ProfileSettingsContext = createContext<ProfileSettingsContextValue | null>(null)

function readStoredProfileSettings(): ProfileSettings {
  if (typeof globalThis === "undefined") {
    return defaultProfileSettings
  }

  try {
    const raw = globalThis.localStorage.getItem(PROFILE_SETTINGS_STORAGE_KEY)

    if (!raw) {
      return defaultProfileSettings
    }

    const parsed = JSON.parse(raw) as unknown

    if (!parsed || typeof parsed !== "object") {
      return defaultProfileSettings
    }

    const value = parsed as Partial<ProfileSettings>

    return {
      name: typeof value.name === "string" ? value.name : "",
      email: typeof value.email === "string" ? value.email : "",
      phone: typeof value.phone === "string" ? value.phone : "",
      github: typeof value.github === "string" ? value.github : "",
      linkedin: typeof value.linkedin === "string" ? value.linkedin : "",
    }
  } catch {
    return defaultProfileSettings
  }
}

function readStoredSkillPool(): string[] {
  if (typeof globalThis === "undefined") {
    return defaultSkillPool
  }

  try {
    const raw = globalThis.localStorage.getItem(SKILL_POOL_STORAGE_KEY)

    if (!raw) {
      return defaultSkillPool
    }

    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return defaultSkillPool
    }

    return parsed.filter((item): item is string => typeof item === "string")
  } catch {
    return defaultSkillPool
  }
}

export function ProfileSettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSettings>(readStoredProfileSettings)
  const [skillPool, setSkillPool] = useState<string[]>(readStoredSkillPool)

  useEffect(() => {
    globalThis.localStorage.setItem(PROFILE_SETTINGS_STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    globalThis.localStorage.setItem(SKILL_POOL_STORAGE_KEY, JSON.stringify(skillPool))
  }, [skillPool])

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      profile,
      skillPool,
      updateProfile: (updates) =>
        setProfile((currentProfile) => ({ ...currentProfile, ...updates })),
      setSkillPool,
    }),
    [profile, skillPool]
  )

  return (
    <ProfileSettingsContext.Provider value={value}>
      {children}
    </ProfileSettingsContext.Provider>
  )
}

export function useProfileSettings() {
  const context = useContext(ProfileSettingsContext)

  if (!context) {
    throw new Error("useProfileSettings must be used within a ProfileSettingsProvider")
  }

  return context
}