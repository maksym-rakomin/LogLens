// Компонент панелі логів з використанням RTK Query для завантаження даних
// Підтримує нескінченний скрол (Infinite Scroll) зі склеюванням даних
"use client"

import { useCallback, useState } from "react"
// Використовуємо хук RTK Query для отримання логів
import { useGetLogsQuery } from "@/lib/store/api"
import type { LogFilters as LogFiltersType } from "@/lib/types"
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
  page: 1,
  cursor: undefined,
}

export function LogsPanel() {
  // 1. Стан фільтрів для керування запитами до API
  const [filters, setFilters] = useState<LogFiltersType>(DEFAULT_FILTERS)

  // 2. Отримуємо дані через RTK Query
  // isFetching буде true щоразу, коли ми довантажуємо нові дані
  const { data, isLoading, isFetching } = useGetLogsQuery(filters, {
    // Відключаємо ревалідацію при фокусі вікна
    refetchOnFocus: false,
  })

  // 3. Обробник для кнопки "Load More" (Cursor Mode)
  // RTK Query зробить запит і завдяки функції merge() додасть нові логи вниз списку
  const handleLoadMore = () => {
    if (data?.meta.hasMore && data.meta.nextCursor) {
      // Просто оновлюємо cursor у стейті
      setFilters(prev => ({ ...prev, cursor: data.meta.nextCursor }))
    }
  }

  // 4. Обробники для класичної пагінації (Offset Mode)
  const handlePrevPage = () => setFilters(f => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))
  const handleNextPage = () => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))

  // 5. Обробник зміни будь-якого фільтра (наприклад, користувач щось ввів у пошук)
  // При зміні фільтрів обов'язково скидаємо page і cursor для очищення списку
  const handleFiltersChange = useCallback((newFilters: LogFiltersType) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,           // Обов'язково скидаємо сторінку
      cursor: undefined  // Обов'язково скидаємо курсор, щоб список очистився
    }))
  }, [])

  // Перевіряємо чи є ще дані для завантаження
  const hasMore =
    filters.mode === "cursor"
      ? data?.meta?.hasMore ?? false
      : (filters.page ?? 1) < (data?.meta?.totalPages ?? 1)

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
        entries={data?.data ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        onLoadMore={filters.mode === "cursor" ? handleLoadMore : undefined}
        hasMore={hasMore}
        // Props для offset-пагінації
        page={filters.page ?? 1}
        totalPages={data?.meta?.totalPages ?? 1}
        onPrevPage={filters.mode === "offset" ? handlePrevPage : undefined}
        onNextPage={filters.mode === "offset" ? handleNextPage : undefined}
      />
    </div>
  )
}
