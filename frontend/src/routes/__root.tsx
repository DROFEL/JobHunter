import { Outlet, createRootRoute } from "@tanstack/react-router"
import { ProfileSettingsProvider } from "@/components/app/profile-settings-context.tsx"
import { Topbar } from "@/components/resume-workbench/topbar.tsx"

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <ProfileSettingsProvider>
      <div className="dark flex h-screen min-h-screen flex-col bg-background text-foreground">
        <Topbar />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ProfileSettingsProvider>
  )
}
