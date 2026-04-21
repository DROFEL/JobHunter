import { useEffect, useMemo, useState } from "react"
import { Link as LinkIcon, Mail, Phone, Plus, UserRound, X } from "lucide-react"
import {
  defaultProfileSettings,
  useProfileSettingsQuery,
  useUpdateProfileSettings,
} from "@/api/hooks/useProfileSettings.ts"
import type { ProfileSettingsDTO } from "@/api/schemas/profileSettings.ts"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { EducationSection } from "./education-section.tsx"

export function ProfileSettingsPage() {
  const { data: settings = defaultProfileSettings } = useProfileSettingsQuery()
  const { mutate: updateProfileSettings, isPending: isSaving } = useUpdateProfileSettings()
  const [draftSettings, setDraftSettings] = useState(settings)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [skillsImportValue, setSkillsImportValue] = useState("")

  useEffect(() => {
    setDraftSettings(settings)
  }, [settings])

  const { profile, education, skillPool } = draftSettings
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draftSettings) !== JSON.stringify(settings),
    [draftSettings, settings],
  )

  function patchSettings(updater: (current: ProfileSettingsDTO) => ProfileSettingsDTO) {
    setSaveError(null)
    setDraftSettings((current) => updater(current))
  }

  function patchProfile<K extends keyof ProfileSettingsDTO["profile"]>(
    field: K,
    value: ProfileSettingsDTO["profile"][K],
  ) {
    patchSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value,
      },
    }))
  }

  function dedupeSkills(skills: string[]) {
    const seen = new Set<string>()

    return skills.filter((skill) => {
      if (!skill) {
        return true
      }

      const normalizedSkill = skill.trim().toLowerCase()
      if (!normalizedSkill || seen.has(normalizedSkill)) {
        return false
      }

      seen.add(normalizedSkill)
      return true
    })
  }

  function updateSkill(index: number, value: string) {
    patchSettings((current) => ({
      ...current,
      skillPool: dedupeSkills(
        current.skillPool.map((skill, currentIndex) =>
          currentIndex === index ? value : skill,
        ),
      ),
    }))
  }

  function importSkillsList() {
    const importedSkills = skillsImportValue
      .replaceAll(" ", "")
      .split(",")
      .filter(Boolean)

    if (importedSkills.length === 0) {
      return
    }

    patchSettings((current) => {
      return {
        ...current,
        skillPool: dedupeSkills([...current.skillPool, ...importedSkills]),
      }
    })

    setSkillsImportValue("")
  }

  function addSkill() {
    patchSettings((current) => ({
      ...current,
      skillPool: [...current.skillPool, ""],
    }))
  }

  function removeSkill(index: number) {
    patchSettings((current) => ({
      ...current,
      skillPool: current.skillPool.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  function handleSaveSettings() {
    updateProfileSettings(draftSettings, {
      onSuccess: () => setSaveError(null),
      onError: (error) => {
        setSaveError(error instanceof Error ? error.message : "Unable to save profile settings.")
      },
    })
  }

  return (
    <main className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <Card className="border-border/70 bg-card/85 backdrop-blur-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Profile Defaults</Badge>
              <Badge variant="outline">Used in Resume Builder Preview</Badge>
            </div>
            <div>
              <CardTitle className="text-2xl">Profile Settings</CardTitle>
              <CardDescription className="mt-2 text-sm leading-relaxed">
                Name, email, phone, GitHub, and LinkedIn are managed here and automatically applied in the builder.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              <p className="text-sm text-muted-foreground">
                Changes stay local until you save, so you can type freely before sending a valid payload.
              </p>
              <Button
                type="button"
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges || isSaving}
              >
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
            {saveError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRound className="size-4" />
                  Full Name
                </span>
                <Input
                  value={profile.name}
                  onChange={(event) => patchProfile("name", event.target.value)}
                  placeholder="John Doe"
                />
              </label>

              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  Email
                </span>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(event) => patchProfile("email", event.target.value)}
                  placeholder="john@example.com"
                />
              </label>

              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4" />
                  Phone
                </span>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) => patchProfile("phone", event.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </label>

              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="size-4" />
                  GitHub URL
                </span>
                <Input
                  value={profile.github}
                  onChange={(event) => patchProfile("github", event.target.value)}
                  placeholder="https://github.com/username"
                />
              </label>

              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="size-4" />
                  LinkedIn URL
                </span>
                <Input
                  value={profile.linkedin}
                  onChange={(event) => patchProfile("linkedin", event.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <EducationSection
          education={education}
          onChange={(value) =>
            patchSettings((current) => ({
              ...current,
              education: value,
            }))}
        />

        <Card className="border-border/70 bg-card/85 backdrop-blur-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Skills Pool</CardTitle>
            <CardDescription>
              Manage the flat list of saved skills that the resume builder can draw from.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={skillsImportValue}
                onChange={(event) => setSkillsImportValue(event.target.value)}
                placeholder="React,TypeScript,TailwindCSS"
              />
              <Button type="button" variant="outline" onClick={importSkillsList}>
                <span>Add</span>
              </Button>
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="size-4" />
                <span>Add Skill</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillPool.map((skill, index) => (
                <div
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-2 py-1"
                >
                  <Input
                    value={skill}
                    onChange={(event) => updateSkill(index, event.target.value)}
                    placeholder="Skill name"
                    size={Math.max(skill.length || 0, 8)}
                    className="h-8 w-auto min-w-20 max-w-48 border-0 bg-transparent px-2 py-0 text-sm shadow-none focus-visible:ring-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkill(index)}
                    className="size-7 shrink-0 rounded-full"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
