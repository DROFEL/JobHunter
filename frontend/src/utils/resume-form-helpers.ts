import type {
  ExperienceItem as ResumeExperienceItem,
  SkillTypeItem,
} from "@/components/resume-workbench/types.ts"

export interface SkillDragPayload {
  skill: string
  sourceTypeId: string | null
}

export function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

export function createBlankExperience(): ResumeExperienceItem {
  return {
    id: createId("experience"),
    company: "",
    duration: "",
    points: [{ id: createId("point"), text: "" }],
  }
}

export function createBlankSkillType(): SkillTypeItem {
  return {
    id: createId("skill-type"),
    name: "",
    skills: [],
  }
}

export function createBlankEducation() {
  return {
    id: createId("education"),
    school: "",
    degree: "",
    year: "",
    description: "",
  }
}

export function createBlankLanguage() {
  return {
    id: createId("language"),
    language: "",
    level: "Fluent",
  }
}

export function createBlankProject() {
  return {
    id: createId("project"),
    name: "",
    description: "",
  }
}

export function getHostname(input: string) {
  try {
    const url = new URL(input)
    return url.hostname.replace(/^www\./, "")
  }
  catch {
    return "job board"
  }
}

export function buildSkillDragPayload(skill: string, sourceTypeId: string | null) {
  return JSON.stringify({
    skill,
    sourceTypeId,
  } satisfies SkillDragPayload)
}

export function parseSkillDragPayload(rawPayload: string): SkillDragPayload | null {
  try {
    const parsed = JSON.parse(rawPayload) as Partial<SkillDragPayload>

    if (typeof parsed.skill !== "string") {
      return null
    }

    return {
      skill: parsed.skill,
      sourceTypeId: parsed.sourceTypeId ?? null,
    }
  }
  catch {
    return null
  }
}