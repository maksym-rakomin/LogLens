import { NextRequest } from "next/server"
import { generateLogs } from "@/lib/log-generator"

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const mode = sp.get("mode") || "stream"

  const logs = generateLogs()

  if (mode === "sync") {
    // Simulate a blocking heavy computation
    const start = performance.now()

    // Count unique IPs
    const uniqueIPs = new Set<string>()
    for (const log of logs) {
      uniqueIPs.add(log.ip)
    }

    // Regex pattern matching
    const errorPattern = /timeout|failed|exception|crashed|error/i
    let errorMatches = 0
    for (const log of logs) {
      if (errorPattern.test(log.message)) errorMatches++
    }

    // Level distribution
    const levelCounts: Record<string, number> = {}
    for (const log of logs) {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1
    }

    // Service distribution
    const serviceCounts: Record<string, number> = {}
    for (const log of logs) {
      serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1
    }

    // Top IPs
    const ipCounts: Record<string, number> = {}
    for (const log of logs) {
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1
    }
    const topIPs = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // Simulate CPU-heavy work
    await new Promise((r) => setTimeout(r, 3000))

    const elapsed = performance.now() - start

    return Response.json({
      mode: "sync",
      totalLogs: logs.length,
      uniqueIPs: uniqueIPs.size,
      errorMatches,
      levelCounts,
      serviceCounts,
      topIPs,
      computeTimeMs: Math.round(elapsed),
      blocked: true,
    })
  }

  // Streaming mode
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendStep = (step: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step, ...data })}\n\n`)
        )
      }

      const totalStart = performance.now()

      // Step 1: Count unique IPs
      sendStep("start", { message: "Starting analysis...", totalLogs: logs.length })
      await new Promise((r) => setTimeout(r, 300))

      const uniqueIPs = new Set<string>()
      for (const log of logs) {
        uniqueIPs.add(log.ip)
      }
      sendStep("unique_ips", {
        message: `Found ${uniqueIPs.size} unique IP addresses`,
        uniqueIPs: uniqueIPs.size,
        progress: 20,
      })
      await new Promise((r) => setTimeout(r, 500))

      // Step 2: Regex matching
      const errorPattern = /timeout|failed|exception|crashed|error/i
      let errorMatches = 0
      for (const log of logs) {
        if (errorPattern.test(log.message)) errorMatches++
      }
      sendStep("regex_matches", {
        message: `Pattern matched ${errorMatches} log entries`,
        errorMatches,
        progress: 40,
      })
      await new Promise((r) => setTimeout(r, 500))

      // Step 3: Level distribution
      const levelCounts: Record<string, number> = {}
      for (const log of logs) {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1
      }
      sendStep("level_distribution", {
        message: "Computed level distribution",
        levelCounts,
        progress: 60,
      })
      await new Promise((r) => setTimeout(r, 500))

      // Step 4: Service distribution
      const serviceCounts: Record<string, number> = {}
      for (const log of logs) {
        serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1
      }
      sendStep("service_distribution", {
        message: "Computed service distribution",
        serviceCounts,
        progress: 80,
      })
      await new Promise((r) => setTimeout(r, 400))

      // Step 5: Top IPs
      const ipCounts: Record<string, number> = {}
      for (const log of logs) {
        ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1
      }
      const topIPs = Object.entries(ipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }))

      const elapsed = performance.now() - totalStart

      sendStep("complete", {
        message: "Analysis complete",
        topIPs,
        computeTimeMs: Math.round(elapsed),
        progress: 100,
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
