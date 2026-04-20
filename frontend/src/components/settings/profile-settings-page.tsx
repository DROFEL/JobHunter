import { Link as LinkIcon, Mail, Phone, Plus, UserRound, X } from "lucide-react"
import { useProfileSettings } from "@/components/app/profile-settings-context.tsx"
import { Badge } from "@/components/ui/badge.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { EducationSection } from "./education-section.tsx";

export function ProfileSettingsPage() {
  const { profile, skillPool, education, setSkillPool, updateProfile, setEducation } = useProfileSettings()

  function updateSkill(index: number, value: string) {
    const nextSkillPool = [...skillPool]
    nextSkillPool[index] = value
    setSkillPool(nextSkillPool)
  }

  function addSkill() {
    setSkillPool([...skillPool, ""])
  }

  function removeSkill(index: number) {
    setSkillPool(skillPool.filter((_, currentIndex) => currentIndex !== index))
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
                  onChange={(event) => updateProfile({ name: event.target.value })}
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
                  onChange={(event) => updateProfile({ email: event.target.value })}
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
                  onChange={(event) => updateProfile({ phone: event.target.value })}
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
                  onChange={(event) => updateProfile({ github: event.target.value })}
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
                  onChange={(event) => updateProfile({ linkedin: event.target.value })}
                  placeholder="https://www.linkedin.com/in/username"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <EducationSection
          education={education}
          onChange={(value) => setEducation(value)}
        />

        <Card className="border-border/70 bg-card/85 backdrop-blur-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Skills Pool</CardTitle>
            <CardDescription>
              Add, edit, remove, and reorder the global skills list. The builder uses this as the draggable source pool.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {skillPool.map((skill, index) => (
              <div key={`${skill}-${index}`} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/65 p-2">
                <Input
                  value={skill}
                  onChange={(event) => updateSkill(index, event.target.value)}
                  placeholder="Skill name"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}>
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="size-4" />
              <span>Add Skill</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
