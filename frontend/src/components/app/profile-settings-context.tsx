import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { EducationItem, ProfileSettings } from "../resume-workbench/types.ts";

const PROFILE_SETTINGS_STORAGE_KEY = "jobhunter.profile-settings.v1"
const SKILL_POOL_STORAGE_KEY = "jobhunter.skill-pool.v1"
const EDUCATION_STORAGE_KEY = "jobhunter.education.v1"

interface ProfileSettingsContextValue {
  profile: ProfileSettings
  skillPool: string[]
  education: EducationItem[]
  updateProfile: (updates: Partial<ProfileSettings>) => void
  setSkillPool: (nextSkillPool: string[]) => void,
  setEducation: (educationItem: EducationItem[]) => void
}

const defaultProfileSettings: ProfileSettings = {
  name: "",
  email: "",
  phone: "",
  github: "",
  linkedin: "",
}
const defaultEducation: EducationItem[] = [{
  id: "edu-1",
  school: "York University",
  degree: "BSc Computer Science",
  year: "Expected August 2026"
}]

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

function isEducationItem(item: unknown): item is EducationItem {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as EducationItem).id === "string" &&
    typeof (item as EducationItem).school === "string" &&
    typeof (item as EducationItem).degree === "string" &&
    typeof (item as EducationItem).year === "string"
  )
}

function readEducation(): EducationItem[] {
  if (typeof globalThis === "undefined") {
    return defaultEducation
  }

  try {
    const raw = globalThis.localStorage.getItem(EDUCATION_STORAGE_KEY)

    if (!raw) {
      return defaultEducation
    }

    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return defaultEducation
    }

    return parsed.filter(isEducationItem)
  } catch {
    return defaultEducation
  }
}

export function ProfileSettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSettings>(readStoredProfileSettings)
  const [skillPool, setSkillPool] = useState<string[]>(readStoredSkillPool)
  const [education, setEducation] = useState<EducationItem[]>(readEducation)

  useEffect(() => {
    globalThis.localStorage.setItem(PROFILE_SETTINGS_STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    globalThis.localStorage.setItem(SKILL_POOL_STORAGE_KEY, JSON.stringify(skillPool))
  }, [skillPool])

  useEffect(() => {
    globalThis.localStorage.setItem(EDUCATION_STORAGE_KEY, JSON.stringify(education))
  }, [education])

  const value = useMemo<ProfileSettingsContextValue>(
    () => ({
      profile,
      skillPool,
      education,
      updateProfile: (updates) =>
        setProfile((currentProfile) => ({ ...currentProfile, ...updates })),
      setSkillPool,
      setEducation
    }),
    [profile, skillPool, education]
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