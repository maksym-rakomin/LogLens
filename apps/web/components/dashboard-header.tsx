"use client"

import { Activity, Database, Search, Wifi, WifiOff } from "lucide-react"

interface DashboardHeaderProps {
  totalLogs: number
  isOnline: boolean
}

export function DashboardHeader({ totalLogs, isOnline }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Search className="size-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            LogLens
          </h1>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          v1.0
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Database className="size-3.5" />
          <span>{totalLogs > 0 ? `${(totalLogs / 1000).toFixed(0)}K entries` : "Loading..."}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Activity className="size-3.5 text-primary" />
          <span>In-Memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi className="size-3.5 text-primary" />
          ) : (
            <WifiOff className="size-3.5 text-log-error" />
          )}
          <span className={`text-xs font-mono ${isOnline ? "text-primary" : "text-log-error"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  )
}
