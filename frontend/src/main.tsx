import './instrumentation'
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"

import "./index.css"
import { router } from "@/router.tsx"

async function prepare() {
  const enableMocks =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true"
    
  if (enableMocks) {
    const { worker } = await import("@/mocks/browser.ts")
    await worker.start({ onUnhandledRequest: "bypass" })
  }
}

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element #root was not found.")
}

prepare().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
})
