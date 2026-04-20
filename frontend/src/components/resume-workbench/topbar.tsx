import { Link } from "@tanstack/react-router"
import { BriefcaseBusiness, FileText, LayoutDashboard, Settings, Sparkles } from "lucide-react"

import { buttonVariants } from "@/components/ui/button.tsx"
import { cn } from "@/utils/utils.ts"

const navigation = [
  { label: "Resume Builder", icon: FileText, to: "/resume-builder" },
  { label: "Job Search", icon: BriefcaseBusiness, to: "/job-search" },
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Settings", icon: Settings, to: "/settings" },
]

export function Topbar() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight">JobHunt Pro</p>
            <p className="truncate text-sm text-muted-foreground">Tailor your resume to every saved role</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navigation.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className={cn(buttonVariants({ variant: "ghost" }), "text-sm text-muted-foreground")}
              activeProps={{
                className: cn(buttonVariants({ variant: "secondary" }), "text-sm shadow-sm"),
              }}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
