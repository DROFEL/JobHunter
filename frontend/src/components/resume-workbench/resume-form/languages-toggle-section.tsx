import type { LanguageItemDTO } from "@/api/schemas/profileSettings.ts"

interface LanguagesToggleSectionProps {
  languages: LanguageItemDTO[]
  enabledIds: string[]
  onChange: (enabledIds: string[]) => void
}

export function LanguagesToggleSection({ languages, enabledIds, onChange }: LanguagesToggleSectionProps) {
  function toggle(id: string) {
    if (enabledIds.includes(id)) {
      onChange(enabledIds.filter((x) => x !== id))
    } else {
      onChange([...enabledIds, id])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Languages</h3>
        <p className="text-xs text-muted-foreground">Toggle which languages appear on this resume</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => {
          const enabled = enabledIds.includes(lang.id)
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => toggle(lang.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                enabled
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/20 hover:bg-accent/50"
              }`}
            >
              <span>{lang.language}</span>
              <span className="text-xs opacity-70">{lang.level}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
