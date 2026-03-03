// Компонент панелі логів з використанням RTK Query для завантаження даних
"use client"

import { useCallback, useEffect, useState } from "react"
// Використовуємо хук RTK Query для отримання логів
import { useGetLogsQuery } from "@/lib/store/api"
import type { LogFilters as LogFiltersType, LogEntry } from "@/lib/types"
import { LogFilters } from "@/components/log-filters"
import { VirtualLogTable } from "@/components/virtual-log-table"

// Фільтри за замовчуванням для відображення логів
const DEFAULT_FILTERS: LogFiltersType = {
  level: "ALL",
  service: "ALL",
  search: "",
  from: "",
  to: "",
  mode: "cursor",
  limit: 200,
}

// Функція для побудови URL з параметрами фільтрації
// Перетворює об'єкт фільтрів у query параметри для API запиту
function buildUrl(filters: LogFiltersType, cursor: number | null, page: number) {
  const params = new URLSearchParams()
  params.set("mode", filters.mode)
  params.set("limit", String(filters.limit))
  if (filters.level !== "ALL") params.set("level", filters.level)
  if (filters.service !== "ALL") params.set("service", filters.service)
  if (filters.search) params.set("search", filters.search)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)

  if (filters.mode === "cursor" && cursor !== null) {
    params.set("cursor", String(cursor))
  } else if (filters.mode === "offset") {
    params.set("page", String(page))
  }

  return `/api/logs?${params.toString()}`
}

export function LogsPanel() {
  // Локальний стан для керування фільтрами
  const [filters, setFilters] = useState<LogFiltersType>(DEFAULT_FILTERS)
  // Стан для накопичення всіх завантажених записів (для пагінації)
  const [allEntries, setAllEntries] = useState<LogEntry[]>([])
  // Курсор для cursor-пагінації
  const [cursor, setCursor] = useState<number | null>(null)
  // Номер сторінки для offset-пагінації
  const [page, setPage] = useState(1)
  // Прапорець завантаження наступної сторінки
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Хук RTK Query для отримання логів
  // Автоматично виконує запит при зміні параметрів
  const { data, isLoading } = useGetLogsQuery(
    // Параметри запиту (перетворюються в query рядок)
    {
      mode: filters.mode,
      limit: filters.limit,
      level: filters.level !== "ALL" ? filters.level : undefined,
      service: filters.service !== "ALL" ? filters.service : undefined,
      search: filters.search || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    },
    {
      // Відключаємо ревалідацію при фокусі вікна
      refetchOnFocus: false,
    }
  )

  // Скидаємо всі завантажені записи при зміні фільтрів
  // Це потрібно щоб показати тільки нові результати пошуку
  useEffect(() => {
    setAllEntries([])
    setCursor(null)
    setPage(1)
  }, [filters.level, filters.service, filters.search, filters.from, filters.to, filters.mode])

  // Додаємо отримані дані до загального списку записів
  // Виконується тільки коли дані завантажені
  useEffect(() => {
    if (data?.data) {
      if (page === 1 && cursor === null) {
        setAllEntries(data.data)
      }
    }
  }, [data, page, cursor])

  // Функція завантаження наступної сторінки логів
  // Використовується для нескінченної прокрутки
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return
    if (!data?.meta) return

    if (filters.mode === "cursor") {
      // Cursor-пагінація: використовуємо nextCursor з метаданих
      const nextCursor = data.meta.nextCursor
      if (!nextCursor) return
      setIsLoadingMore(true)
      try {
        const nextUrl = buildUrl(filters, nextCursor, page)
        const res = await fetch(nextUrl)
        const json: { data: LogEntry[]; meta: any } = await res.json()
        setAllEntries((prev) => [...prev, ...json.data])
        setCursor(nextCursor)
      } finally {
        setIsLoadingMore(false)
      }
    } else {
      // Offset-пагінація: завантажуємо наступну сторінку за номером
      if (page >= (data.meta.totalPages ?? 1)) return
      setIsLoadingMore(true)
      const nextPage = page + 1
      try {
        const nextUrl = buildUrl(filters, null, nextPage)
        const res = await fetch(nextUrl)
        const json: { data: LogEntry[]; meta: any } = await res.json()
        setAllEntries((prev) => [...prev, ...json.data])
        setPage(nextPage)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }, [isLoadingMore, data, filters, page])

  // Перевіряємо чи є ще дані для завантаження
  const hasMore =
    filters.mode === "cursor"
      ? data?.meta?.hasMore ?? false
      : page < (data?.meta?.totalPages ?? 1)

  // Обробник зміни фільтрів
  const handleFiltersChange = useCallback((newFilters: LogFiltersType) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Компонент з фільтрами (рівень, сервіс, пошук тощо) */}
      <LogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        total={data?.meta?.total ?? 0}
        queryTimeMs={data?.meta?.queryTimeMs ?? 0}
      />
      {/* Таблиця з логами з віртуалізацією для продуктивності */}
      <VirtualLogTable
        entries={allEntries}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
    </div>
  )
}
