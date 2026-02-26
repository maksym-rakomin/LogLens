"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ExplainResponse, AnalyzeStep } from "@/lib/types"
import { ArrowRight, Play, Zap, Clock, Terminal } from "lucide-react"

export function PerformancePanel() {
  const [targetPage, setTargetPage] = useState(500)
  const explainUrl = `/api/logs/explain?page=${targetPage}`

  const { data: explainData, isLoading: explainLoading } =
    useSWR<ExplainResponse>(explainUrl, fetcher, { revalidateOnFocus: false })

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto flex-1">
      {/* EXPLAIN comparison */}
      <ExplainComparison
        data={explainData}
        isLoading={explainLoading}
        targetPage={targetPage}
        onTargetPageChange={setTargetPage}
      />

      {/* Sync vs Streaming */}
      <AnalyzeComparison />
    </div>
  )
}

function ExplainComparison({
  data,
  isLoading,
  targetPage,
  onTargetPageChange,
}: {
  data?: ExplainResponse
  isLoading: boolean
  targetPage: number
  onTargetPageChange: (p: number) => void
}) {
  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Terminal className="size-4" />
              EXPLAIN ANALYZE: OFFSET vs Cursor
            </CardTitle>
            <CardDescription className="text-xs font-mono mt-1">
              Simulated PostgreSQL query plan comparison
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Jump to page:</span>
            <div className="flex items-center gap-1">
              {[10, 100, 500, 900].map((p) => (
                <button
                  key={p}
                  onClick={() => onTargetPageChange(p)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    targetPage === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* OFFSET */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs text-log-error border-log-error/30">
                  OFFSET {(targetPage - 1) * 100}
                </Badge>
                <span className="text-sm font-mono font-semibold text-log-error tabular-nums">
                  {data.offset.queryTimeMs.toFixed(1)}ms
                </span>
              </div>
              <pre className="bg-secondary/50 rounded-lg p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                {data.offset.explain.join("\n")}
              </pre>
            </div>

            {/* CURSOR */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                  CURSOR (Keyset)
                </Badge>
                <span className="text-sm font-mono font-semibold text-primary tabular-nums">
                  {data.cursor.queryTimeMs.toFixed(1)}ms
                </span>
              </div>
              <pre className="bg-secondary/50 rounded-lg p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                {data.cursor.explain.join("\n")}
              </pre>
            </div>

            {/* Result */}
            <div className="col-span-2 flex items-center justify-center gap-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Zap className="size-4 text-primary" />
              <span className="text-sm font-mono">
                Cursor pagination is{" "}
                <span className="font-bold text-primary">{data.speedup}</span>{" "}
                at page {targetPage}
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">
                O(1) vs O(offset) complexity
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AnalyzeComparison() {
  const [syncResult, setSyncResult] = useState<{
    computeTimeMs: number
    blocked: boolean
  } | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)

  const [streamSteps, setStreamSteps] = useState<AnalyzeStep[]>([])
  const [streamProgress, setStreamProgress] = useState(0)
  const [streamLoading, setStreamLoading] = useState(false)
  const [streamComplete, setStreamComplete] = useState(false)

  const runSync = useCallback(async () => {
    setSyncResult(null)
    setSyncLoading(true)
    try {
      const res = await fetch("/api/analyze?mode=sync")
      const json = await res.json()
      setSyncResult({ computeTimeMs: json.computeTimeMs, blocked: json.blocked })
    } finally {
      setSyncLoading(false)
    }
  }, [])

  const runStream = useCallback(async () => {
    setStreamSteps([])
    setStreamProgress(0)
    setStreamComplete(false)
    setStreamLoading(true)

    try {
      const res = await fetch("/api/analyze?mode=stream")
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const step: AnalyzeStep = JSON.parse(line.slice(6))
              setStreamSteps((prev) => [...prev, step])
              if (step.progress !== undefined) {
                setStreamProgress(step.progress)
              }
              if (step.step === "complete") {
                setStreamComplete(true)
              }
            } catch {
              // ignore malformed
            }
          }
        }
      }
    } finally {
      setStreamLoading(false)
    }
  }, [])

  return (
    <Card className="py-4 gap-3">
      <CardHeader>
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Clock className="size-4" />
          Heavy Computation: Sync vs Streaming
        </CardTitle>
        <CardDescription className="text-xs font-mono">
          Analyze 100K log entries - compare blocking vs progressive results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Sync */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-xs text-log-error border-log-error/30">
                Synchronous (Blocking)
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={runSync}
                disabled={syncLoading}
                className="h-7 text-xs font-mono gap-1.5"
              >
                <Play className="size-3" />
                {syncLoading ? "Running..." : "Run"}
              </Button>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              {syncLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="size-5 border-2 border-log-error border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-log-error">
                    UI blocked for ~3 seconds...
                  </span>
                </div>
              ) : syncResult ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-log-error tabular-nums">
                    {(syncResult.computeTimeMs / 1000).toFixed(1)}s
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total blocking time
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-log-error border-log-error/30">
                    No intermediate results
                  </Badge>
                </div>
              ) : (
                <span className="text-xs font-mono text-muted-foreground">
                  Click Run to start blocking analysis
                </span>
              )}
            </div>
          </div>

          {/* Stream */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                Streaming (Progressive)
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={runStream}
                disabled={streamLoading}
                className="h-7 text-xs font-mono gap-1.5"
              >
                <Play className="size-3" />
                {streamLoading ? "Streaming..." : "Run"}
              </Button>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 min-h-[120px] flex flex-col gap-2">
              {streamSteps.length === 0 && !streamLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    Click Run to start streaming analysis
                  </span>
                </div>
              ) : (
                <>
                  <Progress value={streamProgress} className="h-1.5" />
                  <div className="flex flex-col gap-1 overflow-auto max-h-[140px]">
                    {streamSteps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[11px] font-mono animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
                      >
                        <span className="text-primary">{">"}</span>
                        <span className="text-foreground">{step.message}</span>
                        {step.progress !== undefined && (
                          <span className="text-muted-foreground ml-auto tabular-nums">
                            {step.progress}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {streamComplete && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-primary border-primary/30 w-fit mt-1"
                    >
                      Progressive results delivered as computed
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
