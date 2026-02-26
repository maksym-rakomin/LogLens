import { NextResponse } from "next/server"
import { generateLogs } from "@/lib/log-generator"

export async function GET() {
  const logs = generateLogs()

  // Level counts
  const levelCounts: Record<string, number> = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 }
  for (const log of logs) {
    levelCounts[log.level]++
  }

  // Service counts
  const serviceCounts: Record<string, number> = {}
  for (const log of logs) {
    serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1
  }

  // Timeline - group by day
  const dayMap = new Map<string, Record<string, number>>()
  for (const log of logs) {
    const day = log.timestamp.slice(0, 10)
    if (!dayMap.has(day)) {
      dayMap.set(day, { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 })
    }
    const bucket = dayMap.get(day)!
    bucket[log.level]++
  }

  const timeline = Array.from(dayMap.entries())
    .map(([date, counts]) => ({
      date,
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Hourly distribution
  const hourMap = new Array(24).fill(0).map(() => ({ INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 }))
  for (const log of logs) {
    const hour = new Date(log.timestamp).getUTCHours()
    hourMap[hour][log.level]++
  }
  const hourly = hourMap.map((counts, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    ...counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  }))

  // Unique IPs
  const uniqueIPs = new Set<string>()
  for (const log of logs) uniqueIPs.add(log.ip)

  return NextResponse.json({
    totalLogs: logs.length,
    uniqueIPs: uniqueIPs.size,
    levelCounts,
    serviceCounts,
    timeline,
    hourly,
  })
}
