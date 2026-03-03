"use client"

import { useEffect, useState } from "react"
// Використовуємо хук RTK Query для отримання статистики
import { useGetStatsQuery } from "@/lib/store/api"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { LogsPanel } from "@/components/logs-panel"
import { AnalyticsPanel } from "@/components/analytics-panel"
import { PerformancePanel } from "@/components/performance-panel"
import { OfflinePanel } from "@/components/offline-panel"
import { SystemTasksPanel } from "@/components/system-tasks-panel"
import {
  ScrollText,
  BarChart3,
  Gauge,
  HardDrive,
  Cpu,
} from "lucide-react"

export default function DashboardPage() {
  const [isOnline, setIsOnline] = useState(true)

  // useGetStatsQuery з RTK Query
  // Хук автоматично керує кешуванням, завантаженням та помилками
  const { data: stats, isLoading, isError } = useGetStatsQuery(undefined, {
    // Можна увімкнути фонове оновлення за необхідності:
    // pollingInterval: 60000,
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="flex flex-col h-dvh bg-background">
      <DashboardHeader
        totalLogs={stats?.totalLogs ?? 0}
        isOnline={isOnline}
      />

      <Tabs defaultValue="logs" className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-10 gap-0 p-0">
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-4 text-xs font-mono gap-1.5"
            >
              <ScrollText className="size-3.5" />
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-4 text-xs font-mono gap-1.5"
            >
              <BarChart3 className="size-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-4 text-xs font-mono gap-1.5"
            >
              <Gauge className="size-3.5" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="offline"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-4 text-xs font-mono gap-1.5"
            >
              <HardDrive className="size-3.5" />
              Offline
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-4 text-xs font-mono gap-1.5"
            >
              <Cpu className="size-3.5" />
              System Tasks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="logs" className="flex-1 min-h-0 mt-0">
          <LogsPanel />
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 min-h-0 mt-0">
          <AnalyticsPanel />
        </TabsContent>

        <TabsContent value="performance" className="flex-1 min-h-0 mt-0">
          <PerformancePanel />
        </TabsContent>

        <TabsContent value="offline" className="flex-1 min-h-0 mt-0">
          <OfflinePanel />
        </TabsContent>

        <TabsContent value="system" className="flex-1 min-h-0 mt-0">
          <SystemTasksPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
