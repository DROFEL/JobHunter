import { createFileRoute } from "@tanstack/react-router"

import { ProfileSettingsPage } from "@/components/settings/profile-settings-page.tsx"
import type {} from "@/routeTree.gen.ts"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  return <ProfileSettingsPage />
}
