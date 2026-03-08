// --- LOGS ---
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  ip: string;
  requestId: string;
}

export interface LogFilters {
  level: LogLevel | "ALL";
  service: string;
  search: string;
  from: string;
  to: string;
  mode: "cursor" | "offset";
  limit: number;
  page?: number;
  cursor?: number | null;
}

export interface LogsMeta {
  mode: string;
  total: number;
  queryTimeMs: number;
  paginationTimeMs: number;
  page?: number;
  totalPages?: number;
  cursor?: number | null;
  nextCursor?: number | null;
  hasMore?: boolean;
  limit: number;
}

export interface LogsResponse {
  data: LogEntry[];
  meta: LogsMeta;
}

// --- EXPLAIN (PERFORMANCE) ---
export interface ExplainPlan {
  queryTimeMs: number;
  explain: string[];
}

export interface ExplainResponse {
  targetPage: number;
  offset: ExplainPlan;
  cursor: ExplainPlan;
  speedup: string;
}

// --- STATS ---
export interface LevelCounts {
  INFO: number;
  WARN: number;
  ERROR: number;
  DEBUG: number;
}

export interface TimelineData extends LevelCounts {
  date: string;
  total: number;
}

export interface HourlyData extends LevelCounts {
  hour: string;
  total: number;
}

export interface StatsResponse {
  totalLogs: number;
  uniqueIPs: number;
  levelCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  timeline: TimelineData[];
  hourly: HourlyData[];
}

// --- ANALYZE ---
export interface AnalyzeStep {
  step: string;
  message: string;
  progress?: number;
  uniqueIPs?: number;
  errorMatches?: number;
  levelCounts?: Record<string, number>;
  serviceCounts?: Record<string, number>;
  topIPs?: Array<{ ip: string; count: number }>;
  computeTimeMs?: number;
  totalLogs?: number;
}

export interface AnalyzeSyncResponse {
  mode: string;
  totalLogs: number;
  uniqueIPs: number;
  errorMatches: number;
  levelCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  topIPs: Array<{ ip: string; count: number }>;
  computeTimeMs: number;
  blocked: boolean;
}

// --- SYSTEM TASKS (WORKER & CHILD PROCESS) ---
export interface WorkerAnalysisResult {
  status: string;
  analyzedCount: number;
  foundErrors: number;
  foundWarns: number;
  regexMatches: number;
  topIp: string;
  topIpCount: number;
  uniqueServices: number;
  timeTakenMs: number;
  type: string;
}

export interface ChildExportResult {
  status: string;
  file: string;
  size: string;
  records: number;
  timeTakenMs: number;
  type: string;
}

export interface ExportFile {
  name: string;
  sizeMB: string;
  createdAt: string;
}

// --- OFFLINE ---
export interface OfflineSavedSearch {
  id: string;
  name: string;
  filters: Partial<LogFilters>;
  data: LogEntry[];
  savedAt: string;
  count: number;
}
