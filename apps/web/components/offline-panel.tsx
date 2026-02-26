"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { LogEntry, OfflineSavedSearch } from "@/lib/types"
import { Database, Download, Trash2, HardDrive, RefreshCw } from "lucide-react"

const DB_NAME = "loglens_offline"
const DB_VERSION = 1
const STORE_NAME = "saved_searches"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

async function getAllSaved(): Promise<OfflineSavedSearch[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveSearch(item: OfflineSavedSearch): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(item)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function deleteSearch(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function OfflinePanel() {
  const [savedSearches, setSavedSearches] = useState<OfflineSavedSearch[]>([])
  const [saveName, setSaveName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [viewData, setViewData] = useState<LogEntry[]>([])
  const [storageEstimate, setStorageEstimate] = useState<string>("")

  const loadSaved = useCallback(async () => {
    try {
      const items = await getAllSaved()
      setSavedSearches(items.sort((a, b) => b.savedAt.localeCompare(a.savedAt)))
    } catch {
      // IndexedDB not available
    }
  }, [])

  useEffect(() => {
    loadSaved()
    estimateStorage()
  }, [loadSaved])

  const estimateStorage = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate()
      const used = ((est.usage || 0) / 1024).toFixed(1)
      const quota = ((est.quota || 0) / (1024 * 1024)).toFixed(0)
      setStorageEstimate(`${used} KB / ${quota} MB`)
    }
  }

  const handleSaveCurrentLogs = useCallback(async () => {
    if (!saveName.trim()) return
    setIsSaving(true)
    try {
      // Fetch current filtered logs
      const res = await fetch("/api/logs?limit=500")
      const json = await res.json()

      const item: OfflineSavedSearch = {
        id: `search_${Date.now()}`,
        name: saveName.trim(),
        filters: {},
        data: json.data,
        savedAt: new Date().toISOString(),
        count: json.data.length,
      }

      await saveSearch(item)
      setSaveName("")
      await loadSaved()
      await estimateStorage()
    } finally {
      setIsSaving(false)
    }
  }, [saveName, loadSaved])

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSearch(id)
      if (viewingId === id) {
        setViewingId(null)
        setViewData([])
      }
      await loadSaved()
      await estimateStorage()
    },
    [viewingId, loadSaved]
  )

  const handleView = useCallback(
    async (item: OfflineSavedSearch) => {
      if (viewingId === item.id) {
        setViewingId(null)
        setViewData([])
      } else {
        setViewingId(item.id)
        setViewData(item.data)
      }
    },
    [viewingId]
  )

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto flex-1">
      {/* Save new search */}
      <Card className="py-4 gap-3">
        <CardHeader>
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <HardDrive className="size-4" />
            Save to IndexedDB
          </CardTitle>
          <CardDescription className="text-xs font-mono">
            Save current log results for offline access using the raw IndexedDB API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name this search..."
              className="flex-1 h-8 text-xs font-mono bg-secondary/50"
            />
            <Button
              size="sm"
              onClick={handleSaveCurrentLogs}
              disabled={!saveName.trim() || isSaving}
              className="h-8 text-xs font-mono gap-1.5"
            >
              <Download className="size-3" />
              {isSaving ? "Saving..." : "Save (500 entries)"}
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs font-mono text-muted-foreground">
            <Database className="size-3.5" />
            <span>Storage: {storageEstimate || "Calculating..."}</span>
            <span className="mx-1">|</span>
            <span>Saved searches: {savedSearches.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Saved searches list */}
      <Card className="py-4 gap-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Database className="size-4" />
              Saved Searches ({savedSearches.length})
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadSaved}
              className="h-7 text-xs font-mono gap-1.5"
            >
              <RefreshCw className="size-3" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {savedSearches.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No saved searches yet. Save your first search above.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedSearches.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                    viewingId === item.id
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.count} entries
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(item.savedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(item)}
                      className="h-7 text-xs font-mono"
                    >
                      {viewingId === item.id ? "Hide" : "View"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-7 text-xs text-log-error hover:text-log-error"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View saved data */}
      {viewingId && viewData.length > 0 && (
        <Card className="py-4 gap-3">
          <CardHeader>
            <CardTitle className="text-sm font-mono">
              Offline Data Preview
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              Loaded from IndexedDB - available without network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-secondary/30 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0">
                <span className="w-10 shrink-0">ID</span>
                <span className="w-32 shrink-0">Timestamp</span>
                <span className="w-12 shrink-0">Level</span>
                <span className="w-28 shrink-0">Service</span>
                <span className="flex-1">Message</span>
              </div>
              {viewData.slice(0, 100).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-1 font-mono text-[11px] border-b border-border/20 hover:bg-secondary/20"
                >
                  <span className="text-muted-foreground w-10 shrink-0 tabular-nums">
                    {entry.id}
                  </span>
                  <span className="text-muted-foreground w-32 shrink-0 tabular-nums">
                    {entry.timestamp.slice(0, 19).replace("T", " ")}
                  </span>
                  <span
                    className={`w-12 shrink-0 font-semibold ${
                      entry.level === "ERROR"
                        ? "text-log-error"
                        : entry.level === "WARN"
                        ? "text-log-warn"
                        : entry.level === "INFO"
                        ? "text-log-info"
                        : "text-log-debug"
                    }`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-primary/80 w-28 shrink-0 truncate">
                    {entry.service}
                  </span>
                  <span className="text-foreground flex-1 truncate">
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground mt-2 block">
              Showing first 100 of {viewData.length} cached entries
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
