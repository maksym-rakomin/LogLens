"use client"

import { useCallback, useEffect, useState } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { LogFilters as LogFiltersType, LogsResponse, LogEntry } from "@/lib/types"
import { LogFilters } from "@/components/log-filters"
import { VirtualLogTable } from "@/components/virtual-log-table"

const DEFAULT_FILTERS: LogFiltersType = {
  level: "ALL",
  service: "ALL",
  search: "",
  from: "",
  to: "",
  mode: "cursor",
  limit: 200,
}

function buildUrl(filters: LogFiltersType, cursor: number | null, page: number) {
  const params = new URLSearchParams()
  params.set("mode", filters.mode)
  params.set("limit", String(filters.limit))
  if (filters.level !== "ALL") params.set("level", filters.level)
  if (filters.service !== "ALL") params.set("service", filters.service)
  if (filters.search) params.set("search", filters.search)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)

  if (filters.mode === "cursor" && cursor !== null) {
    params.set("cursor", String(cursor))
  } else if (filters.mode === "offset") {
    params.set("page", String(page))
  }

  return `/api/logs?${params.toString()}`
}

export function LogsPanel() {
  const [filters, setFilters] = useState<LogFiltersType>(DEFAULT_FILTERS)
  const [allEntries, setAllEntries] = useState<LogEntry[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const url = buildUrl(
    filters,
    filters.mode === "cursor" ? null : null,
    filters.mode === "offset" ? 1 : 1
  )

  const { data, isLoading, mutate } = useSWR<LogsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 500,
  })

  // Reset data when filters change
  useEffect(() => {
    setAllEntries([])
    setCursor(null)
    setPage(1)
  }, [filters.level, filters.service, filters.search, filters.from, filters.to, filters.mode])

  // Append data when response arrives
  useEffect(() => {
    if (data?.data) {
      if (page === 1 && cursor === null) {
        setAllEntries(data.data)
      }
    }
  }, [data, page, cursor])

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return
    if (!data?.meta) return

    if (filters.mode === "cursor") {
      const nextCursor = data.meta.nextCursor
      if (!nextCursor) return
      setIsLoadingMore(true)
      try {
        const nextUrl = buildUrl(filters, nextCursor, page)
        const res = await fetch(nextUrl)
        const json: LogsResponse = await res.json()
        setAllEntries((prev) => [...prev, ...json.data])
        setCursor(nextCursor)
        // Update SWR cache for next load
        mutate(json, false)
      } finally {
        setIsLoadingMore(false)
      }
    } else {
      if (page >= (data.meta.totalPages ?? 1)) return
      setIsLoadingMore(true)
      const nextPage = page + 1
      try {
        const nextUrl = buildUrl(filters, null, nextPage)
        const res = await fetch(nextUrl)
        const json: LogsResponse = await res.json()
        setAllEntries((prev) => [...prev, ...json.data])
        setPage(nextPage)
        mutate(json, false)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }, [isLoadingMore, data, filters, page, mutate])

  const hasMore =
    filters.mode === "cursor"
      ? data?.meta?.hasMore ?? false
      : page < (data?.meta?.totalPages ?? 1)

  const handleFiltersChange = useCallback((newFilters: LogFiltersType) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <LogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        total={data?.meta?.total ?? 0}
        queryTimeMs={data?.meta?.queryTimeMs ?? 0}
      />
      <VirtualLogTable
        entries={allEntries}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
    </div>
  )
}
