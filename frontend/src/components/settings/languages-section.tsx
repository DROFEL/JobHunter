import { Plus, X } from "lucide-react"

import type { LanguageItemDTO } from "@/api/schemas/profileSettings.ts"
import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import { createBlankLanguage } from "@/utils/resume-form-helpers.ts"

const LANGUAGE_LEVELS = ["Native", "Fluent", "Advanced", "Intermediate", "Beginner"] as const

interface LanguagesSectionProps {
  languages: LanguageItemDTO[]
  onChange: (languages: LanguageItemDTO[]) => void
}

export function LanguagesSection({ languages, onChange }: LanguagesSectionProps) {
  function addLanguage() {
    onChange([...languages, createBlankLanguage()])
  }

  function updateLanguage(index: number, field: "language" | "level", value: string) {
    const next = [...languages]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function removeLanguage(index: number) {
    onChange(languages.filter((_, i) => i !== index))
  }

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-accent/20 p-5">
      <div>
        <h3 className="text-lg font-semibold">Languages</h3>
        <p className="text-sm text-muted-foreground">Languages you speak and their proficiency levels</p>
      </div>

      {languages.map((item, index) => (
        <Card key={item.id} className="rounded-xl border-border/60 bg-background shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Input
                value={item.language}
                onChange={(e) => updateLanguage(index, "language", e.target.value)}
                placeholder="Language"
                className="flex-1"
              />
              <Select
                value={item.level}
                onValueChange={(value) => updateLanguage(index, "level", value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLanguage(index)}
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addLanguage}>
        <Plus className="size-4" />
        <span>Add Language</span>
      </Button>
    </section>
  )
}
