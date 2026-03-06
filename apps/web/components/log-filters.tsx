"use client"

import { useCallback, useState } from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import type { LogFilters as LogFiltersType, LogLevel } from "@/lib/types"

const LEVELS: Array<LogLevel | "ALL"> = ["ALL", "INFO", "WARN", "ERROR", "DEBUG"]
const SERVICES = [
  "ALL",
  "api-gateway",
  "auth-service",
  "payment-service",
  "user-service",
  "notification-service",
]

const LEVEL_COLORS: Record<string, string> = {
  ALL: "bg-secondary text-secondary-foreground",
  INFO: "bg-log-info/15 text-log-info border-log-info/30",
  WARN: "bg-log-warn/15 text-log-warn border-log-warn/30",
  ERROR: "bg-log-error/15 text-log-error border-log-error/30",
  DEBUG: "bg-log-debug/15 text-log-debug border-log-debug/30",
}

interface LogFiltersProps {
  filters: LogFiltersType
  onFiltersChange: (filters: LogFiltersType) => void
  total: number
  queryTimeMs: number
}

export function LogFilters({
  filters,
  onFiltersChange,
  total,
  queryTimeMs,
}: LogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  const updateFilter = useCallback(
    (key: keyof LogFiltersType, value: string | number) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange]
  )

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      updateFilter("search", searchInput)
    },
    [searchInput, updateFilter]
  )

  const clearSearch = useCallback(() => {
    setSearchInput("")
    updateFilter("search", "")
  }, [updateFilter])

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <Filter className="size-4 text-muted-foreground shrink-0" />

        {/* Level filters */}
        <div className="flex items-center gap-1.5">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => updateFilter("level", level)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all ${
                filters.level === level
                  ? LEVEL_COLORS[level] + " border-current/30"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/50"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Service filter */}
        <select
          value={filters.service}
          onChange={(e) => updateFilter("service", e.target.value)}
          className="bg-secondary text-secondary-foreground text-xs font-mono rounded-md border border-border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Services" : s}
            </option>
          ))}
        </select>

        <div className="h-5 w-px bg-border" />

        {/* Pagination mode toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-0.5">
          <button
            onClick={() => updateFilter("mode", "cursor")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              filters.mode === "cursor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cursor
          </button>
          <button
            onClick={() => updateFilter("mode", "offset")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              filters.mode === "offset"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Offset
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search logs (supports regex)..."
              className="pl-8 h-8 text-xs font-mono bg-secondary/50 border-border"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs font-mono">
            Search
          </Button>
        </form>

        {/* Results info */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="font-mono text-[10px]">
            {total.toLocaleString()} results
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
            {queryTimeMs.toFixed(1)}ms
          </Badge>
        </div>
      </div>
    </div>
  )
}
