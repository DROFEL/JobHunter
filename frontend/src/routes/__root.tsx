import { Outlet, createRootRoute } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { queryClient } from "@/api/queryClient.ts"
import { Topbar } from "@/components/resume-workbench/topbar.tsx"

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <div className="dark flex h-screen min-h-screen flex-col bg-background text-foreground">
        <Topbar />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  )
}
