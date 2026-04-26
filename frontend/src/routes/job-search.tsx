import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button.tsx"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"
import {
  useCreateSearchConfig,
  useDeleteSearchConfig,
  useDispatchSearch,
  useSearchConfigs,
} from "@/api/hooks/useSearchConfigs.ts"
import type { SearchConfigDTO, SearchStatus } from "@/api/schemas/searchConfig.ts"

export const Route = createFileRoute("/job-search")({
  component: JobSearchPage,
})

const STATUS_STYLES: Record<SearchStatus, string> = {
  Idle: "border-border/70 bg-secondary text-secondary-foreground",
  Running: "border-transparent bg-blue-500/20 text-blue-400",
  Complete: "border-transparent bg-green-500/20 text-green-400",
  Failed: "border-transparent bg-red-500/20 text-red-400",
}

function StatusBadge({ status }: { status: SearchStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

function NewSearchDialog() {
  const [open, setOpen] = useState(false)
  const [board, setBoard] = useState("linkedin")
  const [keywords, setKeywords] = useState("")
  const [location, setLocation] = useState("")
  const [resultsWanted, setResultsWanted] = useState("25")
  const create = useCreateSearchConfig()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params: Record<string, string> = {}
    if (keywords) params.keywords = keywords
    if (location) params.location = location
    create.mutate(
      { board, params, results_wanted: parseInt(resultsWanted, 10) || 25 },
      {
        onSuccess: () => {
          setOpen(false)
          setKeywords("")
          setLocation("")
          setResultsWanted("25")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Search</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Job Search</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Board</label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Keywords</label>
            <Input
              placeholder="e.g. Software Developer"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g. Canada"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Results Wanted</label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={resultsWanted}
              onChange={(e) => setResultsWanted(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SearchRow({ cfg }: { cfg: SearchConfigDTO }) {
  const dispatch = useDispatchSearch()
  const del = useDeleteSearchConfig()
  const keywords = cfg.params.keywords ?? "—"
  const location = cfg.params.location ?? "—"

  return (
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm capitalize">{cfg.board}</td>
      <td className="px-4 py-3 text-sm">{keywords}</td>
      <td className="px-4 py-3 text-sm">{location}</td>
      <td className="px-4 py-3 text-sm text-center">{cfg.results_wanted}</td>
      <td className="px-4 py-3">
        <StatusBadge status={cfg.status} />
      </td>
      <td className="px-4 py-3 text-sm text-center">{cfg.scraped_last_run}</td>
      <td className="px-4 py-3 text-sm text-center">{cfg.scraped_total}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={cfg.status === "Running" || dispatch.isPending}
            onClick={() => dispatch.mutate(cfg.id)}
          >
            {cfg.status === "Running" ? "Running…" : "Dispatch"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={del.isPending}
            onClick={() => del.mutate(cfg.id)}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}

function JobSearchPage() {
  const { data: configs, isLoading, isError } = useSearchConfigs()

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job Searches</h1>
        <NewSearchDialog />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Failed to load search configs.</p>
      )}

      {configs && (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Board</th>
                <th className="px-4 py-3">Keywords</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-center">Results</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Last Run</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No search configs yet. Create one to get started.
                  </td>
                </tr>
              )}
              {configs.map((cfg) => (
                <SearchRow key={cfg.id} cfg={cfg} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
