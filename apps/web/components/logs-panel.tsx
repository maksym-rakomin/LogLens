// Logs panel component using RTK Query for loading data
// Supports infinite scroll with data merging
"use client"

import { useCallback, useState } from "react"
// Use RTK Query hook to get logs
import { useGetLogsQuery } from "@/lib/store/api"
import type { LogFilters as LogFiltersType } from "@workspace/types"
import { LogFilters } from "@/components/log-filters"
import { VirtualLogTable } from "@/components/virtual-log-table"

// Default filters for displaying logs
const DEFAULT_FILTERS: LogFiltersType = {
  level: "ALL",
  service: "ALL",
  search: "",
  from: "",
  to: "",
  mode: "cursor",
  limit: 200,
  page: 1,
  cursor: undefined,
}

export function LogsPanel() {
  // 1. Filter state for controlling API requests
  const [filters, setFilters] = useState<LogFiltersType>(DEFAULT_FILTERS)

  // 2. Get data via RTK Query
  // isFetching will be true every time we load new data
  const { data, isLoading, isFetching } = useGetLogsQuery(filters, {
    // Disable refetch on window focus
    refetchOnFocus: false,
  })

  // 3. Handler for "Load More" button (Cursor Mode)
  // RTK Query will make a request and thanks to merge() function will append new logs to the bottom of the list
  const handleLoadMore = () => {
    if (data?.meta.hasMore && data.meta.nextCursor) {
      // Just update cursor in state
      setFilters(prev => ({ ...prev, cursor: data.meta.nextCursor }))
    }
  }

  // 4. Handlers for classic pagination (Offset Mode)
  const handlePrevPage = () => setFilters(f => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))
  const handleNextPage = () => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))

  // 5. Handler for any filter change (e.g., user types in search)
  // When filters change, we must reset page and cursor to clear the list
  const handleFiltersChange = useCallback((newFilters: LogFiltersType) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,           // Reset page
      cursor: undefined  // Reset cursor to clear the list
    }))
  }, [])

  // Check if there's more data to load
  const hasMore =
    filters.mode === "cursor"
      ? data?.meta?.hasMore ?? false
      : (filters.page ?? 1) < (data?.meta?.totalPages ?? 1)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters component (level, service, search, etc.) */}
      <LogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        total={data?.meta?.total ?? 0}
        queryTimeMs={data?.meta?.queryTimeMs ?? 0}
      />
      {/* Log table with virtualization for performance */}
      <VirtualLogTable
        entries={data?.data ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        onLoadMore={filters.mode === "cursor" ? handleLoadMore : undefined}
        hasMore={hasMore}
        // Props for offset pagination
        page={filters.page ?? 1}
        totalPages={data?.meta?.totalPages ?? 1}
        onPrevPage={filters.mode === "offset" ? handlePrevPage : undefined}
        onNextPage={filters.mode === "offset" ? handleNextPage : undefined}
      />
    </div>
  )
}
