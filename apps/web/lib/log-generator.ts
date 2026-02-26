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

const SERVICES = ["api-gateway", "auth-service", "payment-service", "user-service", "notification-service"]

const MESSAGES: Record<LogLevel, string[]> = {
  INFO: [
    "Request processed successfully",
    "User session created",
    "Cache hit for resource",
    "Database connection pool healthy",
    "Scheduled job completed",
    "Configuration reloaded",
    "Health check passed",
    "WebSocket connection established",
    "Rate limit threshold updated",
    "Metric export completed",
  ],
  WARN: [
    "High memory usage detected: 85%",
    "Slow query detected: 1200ms",
    "Rate limit approaching threshold",
    "Certificate expiring in 30 days",
    "Retry attempt 2/3 for external API",
    "Connection pool nearing capacity",
    "Deprecated API version called",
    "Disk usage above 75%",
  ],
  ERROR: [
    "Database connection timeout after 30s",
    "Authentication failed: invalid token",
    "Payment processing failed: gateway error",
    "Unhandled exception in request handler",
    "External API returned 503",
    "Failed to parse JSON payload",
    "Queue consumer crashed unexpectedly",
    "TLS handshake failed",
  ],
  DEBUG: [
    "Entering function processOrder()",
    "SQL query plan: sequential scan",
    "Request headers: content-type=application/json",
    "Cache key generated: usr_a8f3",
    "Event loop lag: 2ms",
    "GC pause: 15ms",
    "Thread pool utilization: 45%",
  ],
}

const LEVEL_WEIGHTS: [LogLevel, number][] = [
  ["INFO", 0.5],
  ["DEBUG", 0.25],
  ["WARN", 0.15],
  ["ERROR", 0.1],
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function pickLevel(rand: () => number): LogLevel {
  const r = rand()
  let cumulative = 0
  for (const [level, weight] of LEVEL_WEIGHTS) {
    cumulative += weight
    if (r <= cumulative) return level
  }
  return "INFO"
}

function generateIP(rand: () => number): string {
  return `${Math.floor(rand() * 200) + 10}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 254) + 1}`
}

function generateRequestId(rand: () => number): string {
  const chars = "abcdef0123456789"
  let id = "req_"
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(rand() * chars.length)]
  }
  return id
}

let cachedLogs: LogEntry[] | null = null

export function generateLogs(count: number = 100_000): LogEntry[] {
  if (cachedLogs && cachedLogs.length === count) return cachedLogs

  const rand = seededRandom(42)
  const logs: LogEntry[] = new Array(count)

  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  for (let i = 0; i < count; i++) {
    const level = pickLevel(rand)
    const service = SERVICES[Math.floor(rand() * SERVICES.length)]
    const messages = MESSAGES[level]
    const message = messages[Math.floor(rand() * messages.length)]
    const timestamp = new Date(now - Math.floor(rand() * thirtyDaysMs)).toISOString()

    logs[i] = {
      id: i + 1,
      timestamp,
      level,
      service,
      message,
      ip: generateIP(rand),
      request_id: generateRequestId(rand),
    }
  }

  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  for (let i = 0; i < logs.length; i++) {
    logs[i].id = i + 1
  }

  cachedLogs = logs
  return logs
}

export function filterLogs(
  logs: LogEntry[],
  filters: {
    level?: LogLevel | "ALL"
    service?: string | "ALL"
    search?: string
    from?: string
    to?: string
  }
): LogEntry[] {
  let result = logs

  if (filters.level && filters.level !== "ALL") {
    result = result.filter((l) => l.level === filters.level)
  }

  if (filters.service && filters.service !== "ALL") {
    result = result.filter((l) => l.service === filters.service)
  }

  if (filters.search) {
    try {
      const regex = new RegExp(filters.search, "i")
      result = result.filter(
        (l) => regex.test(l.message) || regex.test(l.ip) || regex.test(l.request_id)
      )
    } catch {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(term) ||
          l.ip.includes(term) ||
          l.request_id.includes(term)
      )
    }
  }

  if (filters.from) {
    const fromTime = new Date(filters.from).getTime()
    result = result.filter((l) => new Date(l.timestamp).getTime() >= fromTime)
  }

  if (filters.to) {
    const toTime = new Date(filters.to).getTime()
    result = result.filter((l) => new Date(l.timestamp).getTime() <= toTime)
  }

  return result
}
