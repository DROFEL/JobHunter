import { Outlet, createRootRoute, redirect, useRouterState } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { getAuthId } from "@/api/auth.ts"
import { queryClient } from "@/api/queryClient.ts"
import { Topbar } from "@/components/resume-workbench/topbar.tsx"

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!getAuthId() && location.pathname !== "/login") {
      throw redirect({ to: "/login" })
    }
  },
  component: Root,
})

function Root() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showChrome = pathname !== "/login"

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <div className="dark flex h-screen min-h-screen flex-col bg-background text-foreground">
        {showChrome && <Topbar />}
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  )
}
