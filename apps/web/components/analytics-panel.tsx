// Analytics panel component using RTK Query for loading statistics
"use client"

// Use RTK Query hook to get statistics
import { useGetStatsQuery } from "@/lib/store/api"
import type { StatsResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Colors for different log levels (INFO, WARN, ERROR, DEBUG)
const LEVEL_COLORS: Record<string, string> = {
  INFO: "oklch(0.65 0.18 250)",
  WARN: "oklch(0.75 0.15 65)",
  ERROR: "oklch(0.55 0.22 25)",
  DEBUG: "oklch(0.45 0.01 260)",
}

// Colors for different services in the system
const SERVICE_COLORS = [
  "oklch(0.65 0.18 160)",
  "oklch(0.65 0.18 250)",
  "oklch(0.75 0.15 65)",
  "oklch(0.55 0.22 25)",
  "oklch(0.60 0.12 200)",
]

// Stat card component (numeric value + label)
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold text-foreground tabular-nums font-mono">
        {value}
      </span>
    </div>
  )
}

// Custom tooltip component for charts
// Displays detailed information when hovering over chart points
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-mono text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-foreground font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPanel() {
  // RTK Query hook for getting statistics
  // undefined means we're not passing any parameters to the query
  const { data, isLoading } = useGetStatsQuery(undefined, {
    // Disable refetch on window focus
    refetchOnFocus: false,
  })

  // Show loading indicator while data is being fetched
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-mono">
            Computing analytics...
          </span>
        </div>
      </div>
    )
  }

  // Convert log levels data to PieChart format
  const levelData = Object.entries(data.levelCounts).map(([name, value]) => ({
    name,
    value,
  }))

  // Convert services data to BarChart format
  // Remove suffixes from names for display
  const serviceData = Object.entries(data.serviceCounts).map(([name, value]) => ({
    name: name.replace("-service", "").replace("api-", ""),
    fullName: name,
    value,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto flex-1">
      {/* Stat cards with main statistics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Logs" value={data.totalLogs.toLocaleString()} />
        <StatCard label="Unique IPs" value={data.uniqueIPs.toLocaleString()} />
        <StatCard
          label="Error Rate"
          value={`${((data.levelCounts.ERROR / data.totalLogs) * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Warn Rate"
          value={`${((data.levelCounts.WARN / data.totalLogs) * 100).toFixed(1)}%`}
        />
      </div>

      {/* Log volume timeline chart (AreaChart) */}
      <Card className="py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-mono">Log Volume Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} />
                <Tooltip content={<CustomTooltip />} />
                {/* Chart layers for each log level */}
                <Area
                  type="monotone"
                  dataKey="ERROR"
                  stackId="1"
                  fill={LEVEL_COLORS.ERROR}
                  stroke={LEVEL_COLORS.ERROR}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="WARN"
                  stackId="1"
                  fill={LEVEL_COLORS.WARN}
                  stroke={LEVEL_COLORS.WARN}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="INFO"
                  stackId="1"
                  fill={LEVEL_COLORS.INFO}
                  stroke={LEVEL_COLORS.INFO}
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="DEBUG"
                  stackId="1"
                  fill={LEVEL_COLORS.DEBUG}
                  stroke={LEVEL_COLORS.DEBUG}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Pie chart for log level distribution */}
        <Card className="py-4 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-mono">Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {levelData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={LEVEL_COLORS[entry.name] ?? "#666"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend for pie chart */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {levelData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-mono">
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: LEVEL_COLORS[entry.name] ?? "#666" }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal bar chart for service distribution */}
        <Card className="py-4 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-mono">Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.22 0.01 260)"
                    horizontal={false}
                  />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {serviceData.map((_, i) => (
                      <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly distribution histogram (UTC) */}
      <Card className="py-4 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-mono">Hourly Distribution (UTC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 260)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: "oklch(0.60 0.01 260)" }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 260)" }} />
                <Tooltip content={<CustomTooltip />} />
                {/* Stacked bars for each log level */}
                <Bar dataKey="INFO" stackId="a" fill={LEVEL_COLORS.INFO} />
                <Bar dataKey="WARN" stackId="a" fill={LEVEL_COLORS.WARN} />
                <Bar dataKey="ERROR" stackId="a" fill={LEVEL_COLORS.ERROR} />
                <Bar dataKey="DEBUG" stackId="a" fill={LEVEL_COLORS.DEBUG} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
