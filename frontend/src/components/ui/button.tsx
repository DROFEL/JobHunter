import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/utils/utils.ts"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,box-shadow,transform,background-color] outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-4 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-[var(--input-background)] text-foreground shadow-sm hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps =
  & React.ComponentProps<"button">
  & VariantProps<typeof buttonVariants>
  & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
