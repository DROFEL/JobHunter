import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/utils/utils.ts"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-border/70 bg-secondary text-secondary-foreground",
        outline: "border-border/70 bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type BadgeProps =
  & React.ComponentProps<"div">
  & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
