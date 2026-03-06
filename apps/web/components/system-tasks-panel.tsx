// Component to demonstrate the difference between Worker Threads and Child Process
"use client"

import { useState, useEffect } from "react"
import { SystemApi } from "@/lib/api-handlers/system-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cpu, Archive, Play, CheckCircle2, Loader2, Download, FileArchive, Clock } from "lucide-react"

// Type definition for history file
interface ExportFile {
  name: string;
  sizeMB: string;
  createdAt: string;
}

/**
 * System Tasks Panel
 * Demonstrates two approaches to executing heavy tasks in Node.js:
 *
 * 1. Worker Threads - threads inside Node.js for heavy computations
 *    - Use shared memory
 *    - Lighter on resources
 *    - Ideal for data processing, analysis, mathematical computations
 *
 * 2. Child Process - separate OS processes for running external programs
 *    - Full process isolation
 *    - Can run any system utilities
 *    - Ideal for archiving, backups, calling tar/zip/pg_dump
 */
export function SystemTasksPanel() {
  // State for Worker Thread (log analysis)
  const [workerLoading, setWorkerLoading] = useState(false)
  const [workerResult, setWorkerResult] = useState<any>(null)

  // State for Child Process (export/archiving)
  const [childLoading, setChildLoading] = useState(false)
  const [childResult, setChildResult] = useState<any>(null)

  // State for file history
  const [historyFiles, setHistoryFiles] = useState<ExportFile[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Load file list on component mount
  useEffect(() => {
    fetchHistory()
  }, [])

  /**
   * Function to refresh file list
   * Called on component mount and after successful export
   */
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const files = await SystemApi.getExportFiles()
      setHistoryFiles(files)
    } catch (error) {
      console.error("Failed to load history", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  /**
   * Start Worker Thread
   * Calls API to run log analysis via Worker Thread
   */
  const handleWorkerStart = async () => {
    setWorkerLoading(true)
    setWorkerResult(null)
    try {
      const data = await SystemApi.runWorkerAnalysis()
      setWorkerResult(data)
    } catch (error) {
      console.error(error)
    } finally {
      setWorkerLoading(false)
    }
  }

  /**
   * Start Child Process
   * Calls API to run export via Child Process
   * Updates history list after successful completion
   */
  const handleChildStart = async () => {
    setChildLoading(true)
    setChildResult(null)
    try {
      const data = await SystemApi.runChildProcessExport()
      setChildResult(data)
      // After successful archive creation, refresh file list at bottom
      fetchHistory()
    } catch (error) {
      console.error(error)
    } finally {
      setChildLoading(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-auto">

      {/* Top row with two main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Worker Threads card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Cpu className="size-5" />
              Worker Threads (CPU Bound)
            </CardTitle>
            <CardDescription>
              Executes heavy log analysis in a background Node.js thread without blocking the main Event Loop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleWorkerStart}
              disabled={workerLoading}
              className="w-full"
            >
              {workerLoading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Play className="mr-2 size-4" /> Run Analysis</>
              )}
            </Button>

            {/* Display Worker result */}
            {workerResult && (
              <div className="p-4 rounded-md bg-muted/50 border border-border space-y-2 text-sm font-mono">
                <div className="flex items-center text-green-500 mb-2">
                  <CheckCircle2 className="size-4 mr-2" /> Analysis Complete
                </div>
                <p><span className="text-muted-foreground">Type:</span> {workerResult.type}</p>
                <p><span className="text-muted-foreground">Total Analyzed:</span> {workerResult.analyzedCount} records</p>

                <div className="grid grid-cols-2 gap-2 my-2 p-2 bg-background rounded border border-border">
                  <p><span className="text-destructive">Errors:</span> {workerResult.foundErrors}</p>
                  <p><span className="text-yellow-500">Warnings:</span> {workerResult.foundWarns}</p>
                  <p><span className="text-muted-foreground">Regex Matches:</span> {workerResult.regexMatches}</p>
                  <p><span className="text-muted-foreground">Services:</span> {workerResult.uniqueServices}</p>
                </div>

                <p><span className="text-muted-foreground">Top Attacker IP:</span> {workerResult.topIp} <span className="text-xs text-muted-foreground">({workerResult.topIpCount} requests)</span></p>
                <p><span className="text-muted-foreground">Execution Time:</span> {workerResult.timeTakenMs} ms</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Child Process card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Archive className="size-5" />
              Child Process (OS Level)
            </CardTitle>
            <CardDescription>
              Spawns a separate OS process to fetch, compress, and export database logs into a GZIP archive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleChildStart}
              disabled={childLoading}
              variant="secondary"
              className="w-full"
            >
              {childLoading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Creating Archive...</>
              ) : (
                <><Play className="mr-2 size-4" /> Run Database Export</>
              )}
            </Button>

            {childResult && (
              <div className="p-4 rounded-md bg-muted/50 border border-border space-y-2 text-sm font-mono">
                <div className="flex items-center text-green-500 mb-2">
                  <CheckCircle2 className="size-4 mr-2" /> Archive Created Successfully
                </div>
                <p><span className="text-muted-foreground">Type:</span> {childResult.type}</p>
                <p><span className="text-muted-foreground">File:</span> {childResult.file}</p>
                <p><span className="text-muted-foreground">Size:</span> {childResult.size}</p>
                <p><span className="text-muted-foreground">Records:</span> {childResult.records}</p>
                <p><span className="text-muted-foreground">Execution Time:</span> {childResult.timeTakenMs} ms</p>

                {/* Button for instant download of newly created file */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  asChild
                >
                  <a href={SystemApi.getDownloadUrl(childResult.file)} download>
                    <Download className="mr-2 size-4" /> Download Archive
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: Export History */}
      <Card className="bg-card border-border mt-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileArchive className="size-5" />
            Export History
          </CardTitle>
          <CardDescription>
            List of previously generated log archives available for download.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" /> Loading history...
            </div>
          ) : historyFiles.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-md">
              No archives found. Run an export to generate one.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Render file list */}
              {historyFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-foreground">{file.name}</span>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Archive className="size-3" /> {file.sizeMB} MB
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {new Date(file.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Download button for each file in history */}
                  <Button variant="ghost" size="icon" asChild title="Download">
                    <a href={SystemApi.getDownloadUrl(file.name)} download>
                      <Download className="size-4 text-primary" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
