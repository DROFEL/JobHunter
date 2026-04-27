import { useState } from "react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { api } from "@/api/client.ts"
import { clearAuthId, getAuthId, setAuthId } from "@/api/auth.ts"

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getAuthId()) {
      throw redirect({ to: "/" })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [id, setId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = id.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    setAuthId(trimmed)
    try {
      await api.post("/users", z.unknown(), { data: {} })
      navigate({ to: "/" })
    } catch (err) {
      clearAuthId()
      setError(err instanceof Error ? err.message : "Failed to sign in")
      setSubmitting(false)
    }
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background/85 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Welcome to JobHunt Pro</h1>
            <p className="text-sm text-muted-foreground">Enter a user ID to continue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-id" className="text-sm font-medium">User ID</label>
            <Input
              id="auth-id"
              autoFocus
              autoComplete="username"
              placeholder="e.g. george"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={!id.trim() || submitting}>
            {submitting ? "Signing in…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  )
}
