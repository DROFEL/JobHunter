import { ArrowDown, ArrowUp, X } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { cn } from "@/lib/utils.ts"

interface WorkExperienceItemProps {
  point: string
  canMoveUp: boolean
  canMoveDown: boolean
  isDragging: boolean
  moveUp: () => void
  moveDown: () => void
  updatePoint: (value: string) => void
  removePoint: () => void
}

export function WorkExperienceItem({
  point,
  canMoveUp,
  canMoveDown,
  isDragging,
  moveUp,
  moveDown,
  updatePoint,
  removePoint,
}: WorkExperienceItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[1.35rem] border border-border/60 bg-background/55 p-2 transition",
        isDragging && "opacity-60",
      )}
    >
      <Input
        value={point}
        onChange={(event) => updatePoint(event.target.value)}
        placeholder="Describe your achievement..."
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
      />

      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={moveUp} disabled={!canMoveUp}>
          <ArrowUp className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={moveDown} disabled={!canMoveDown}>
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={removePoint}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
