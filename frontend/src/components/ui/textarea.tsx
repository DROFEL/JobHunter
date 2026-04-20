import type * as React from "react"

import { cn } from "@/utils/utils.ts"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-input bg-[var(--input-background)] px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
