export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG"

export interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  service: string
  message: string
  ip: string
  request_id: string
}

export interface LogFilters {
  level: LogLevel | "ALL"
  service: string
  search: string
  from: string
  to: string
  mode: "cursor" | "offset"
  limit: number
}

export interface LogsMeta {
  mode: string
  total: number
  queryTimeMs: number
  paginationTimeMs: number
  page?: number
  totalPages?: number
  cursor?: number | null
  nextCursor?: number | null
  hasMore?: boolean
  limit: number
}

export interface LogsResponse {
  data: LogEntry[]
  meta: LogsMeta
}

export interface ExplainResponse {
  targetPage: number
  total: number
  offset: {
    queryTimeMs: number
    rowsReturned: number
    explain: string[]
  }
  cursor: {
    queryTimeMs: number
    rowsReturned: number
    explain: string[]
  }
  speedup: string
}

export interface StatsResponse {
  totalLogs: number
  uniqueIPs: number
  levelCounts: Record<string, number>
  serviceCounts: Record<string, number>
  timeline: Array<{
    date: string
    INFO: number
    WARN: number
    ERROR: number
    DEBUG: number
    total: number
  }>
  hourly: Array<{
    hour: string
    INFO: number
    WARN: number
    ERROR: number
    DEBUG: number
    total: number
  }>
}

export interface AnalyzeStep {
  step: string
  message: string
  progress?: number
  uniqueIPs?: number
  errorMatches?: number
  levelCounts?: Record<string, number>
  serviceCounts?: Record<string, number>
  topIPs?: Array<{ ip: string; count: number }>
  computeTimeMs?: number
  totalLogs?: number
}

export interface OfflineSavedSearch {
  id: string
  name: string
  filters: Partial<LogFilters>
  data: LogEntry[]
  savedAt: string
  count: number
}
