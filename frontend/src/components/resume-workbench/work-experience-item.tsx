import { X } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"

interface WorkExperienceItemProps {
  point: string
  updatePoint: (value: string) => void
  removePoint: () => void
}

export function WorkExperienceItem({ point, updatePoint, removePoint }: WorkExperienceItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-[1.35rem] border border-border/60 bg-background/55 p-2 transition">
      <Input
        value={point}
        onChange={(event) => updatePoint(event.target.value)}
        placeholder="Describe your achievement..."
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
      />

      <Button type="button" variant="ghost" size="icon" onClick={removePoint}>
        <X className="size-4" />
      </Button>
    </div>
  )
}
