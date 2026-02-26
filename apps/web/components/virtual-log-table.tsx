"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react"
import type { LogEntry, LogLevel } from "@/lib/types"

const ROW_HEIGHT = 32
const OVERSCAN = 10

const LEVEL_STYLES: Record<LogLevel, string> = {
  INFO: "text-log-info",
  WARN: "text-log-warn",
  ERROR: "text-log-error",
  DEBUG: "text-log-debug",
}

const LEVEL_DOT_STYLES: Record<LogLevel, string> = {
  INFO: "bg-log-info",
  WARN: "bg-log-warn",
  ERROR: "bg-log-error",
  DEBUG: "bg-log-debug",
}

interface LogRowProps {
  entry: LogEntry
  style: React.CSSProperties
}

const LogRow = memo(function LogRow({ entry, style }: LogRowProps) {
  const ts = entry.timestamp.slice(0, 19).replace("T", " ")

  return (
    <div
      style={style}
      className="flex items-center gap-3 px-4 font-mono text-xs border-b border-border/30 hover:bg-secondary/30 transition-colors"
    >
      <span className="text-muted-foreground w-12 shrink-0 tabular-nums text-right">
        {entry.id}
      </span>
      <span className="text-muted-foreground w-36 shrink-0 tabular-nums">
        {ts}
      </span>
      <span className={`flex items-center gap-1.5 w-14 shrink-0 font-semibold ${LEVEL_STYLES[entry.level]}`}>
        <span className={`size-1.5 rounded-full ${LEVEL_DOT_STYLES[entry.level]}`} />
        {entry.level}
      </span>
      <span className="text-primary/80 w-36 shrink-0 truncate">
        {entry.service}
      </span>
      <span className="text-foreground flex-1 truncate">
        {entry.message}
      </span>
      <span className="text-muted-foreground w-28 shrink-0 text-right truncate">
        {entry.ip}
      </span>
    </div>
  )
})

interface VirtualLogTableProps {
  entries: LogEntry[]
  isLoading: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function VirtualLogTable({
  entries,
  isLoading,
  onLoadMore,
  hasMore,
}: VirtualLogTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((es) => {
      const h = es[0]?.contentRect.height
      if (h) setContainerHeight(h)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    setScrollTop(container.scrollTop)

    // Infinite scroll - load more when near bottom
    if (
      hasMore &&
      onLoadMore &&
      container.scrollTop + container.clientHeight >=
        container.scrollHeight - ROW_HEIGHT * 5
    ) {
      onLoadMore()
    }
  }, [hasMore, onLoadMore])

  const { startIndex, endIndex, visibleItems, totalHeight } = useMemo(() => {
    const total = entries.length
    const totalH = total * ROW_HEIGHT
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT)
    const end = Math.min(total - 1, start + visibleCount + OVERSCAN * 2)

    const items: Array<{ entry: LogEntry; style: React.CSSProperties }> = []
    for (let i = start; i <= end; i++) {
      items.push({
        entry: entries[i],
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: ROW_HEIGHT,
          transform: `translateY(${i * ROW_HEIGHT}px)`,
        },
      })
    }

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items,
      totalHeight: totalH,
    }
  }, [entries, scrollTop, containerHeight])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
        <span className="w-12 shrink-0 text-right">ID</span>
        <span className="w-36 shrink-0">Timestamp</span>
        <span className="w-14 shrink-0">Level</span>
        <span className="w-36 shrink-0">Service</span>
        <span className="flex-1">Message</span>
        <span className="w-28 shrink-0 text-right">IP Address</span>
      </div>

      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto min-h-0"
        role="log"
        aria-label="Log entries"
      >
        {isLoading && entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground font-mono">
                Loading logs...
              </span>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted-foreground">
              No logs match the current filters
            </span>
          </div>
        ) : (
          <div
            style={{ height: totalHeight, position: "relative" }}
          >
            {visibleItems.map((item) => (
              <LogRow
                key={item.entry.id}
                entry={item.entry}
                style={item.style}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-secondary/20 text-[10px] font-mono text-muted-foreground shrink-0">
        <span>
          Showing rows {startIndex + 1}-{Math.min(endIndex + 1, entries.length)}{" "}
          of {entries.length.toLocaleString()}
        </span>
        <span>
          Virtual DOM: {visibleItems.length} rows rendered |{" "}
          Row height: {ROW_HEIGHT}px | Overscan: {OVERSCAN}
        </span>
        {hasMore && (
          <span className="text-primary">Scroll down to load more</span>
        )}
      </div>
    </div>
  )
}
