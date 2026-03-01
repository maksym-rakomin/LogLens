import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetLogsDto } from '../../common/dto/get-logs.dto';
import { Log, Prisma } from '../../../generated/prisma/client';

/**
 * Сервіс для роботи з логами
 * Відповідає за отримання логів та аналіз продуктивності запитів
 */
@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Отримання списку логів з фільтрацією та пагінацією
   * Підтримує два режими: offset (класична пагінація по сторінках)
   * і cursor (швидка пагінація для великих обсягів даних)
   */
  async getLogs(dto: GetLogsDto) {
    // Запускаємо таймер для вимірювання часу виконання запиту
    const startTime = performance.now();
    // Витягуємо параметри із запиту та приводимо до правильного типу
    // Query-параметри завжди приходять як рядки, тому явно перетворюємо
    const limit = Number(dto.limit) || 100;
    const page = Number(dto.page) || 1;
    const { mode, level, service, search, from, to, cursor } = dto;

    // Формуємо умови фільтрації для бази даних
    const where: Prisma.LogWhereInput = {};
    // Фільтр за рівнем логування (INFO, WARN, ERROR, DEBUG)
    if (level !== 'ALL') where.level = level as any;
    // Фільтр за назвою сервісу
    if (service !== 'ALL') where.service = service;
    // Пошук за текстом повідомлення (без урахування регістру)
    if (search) where.message = { contains: search, mode: 'insensitive' };
    // Фільтр за часовим діапазоном
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    let data: Log[] = [];
    let meta: any = {};

    // Режим класичної постраничної нумерації
    if (mode === 'offset') {
      // Обчислюємо кількість записів для пропуску
      const skip = (page - 1) * limit;
      const startSlice = performance.now();

      // Паралельно отримуємо логи та загальну кількість записів
      const [logs, total] = await Promise.all([
        this.prisma.log.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        this.prisma.log.count({ where }),
      ]);

      const sliceTime = performance.now() - startSlice;

      data = logs;
      // Метадані для offset-пагінації
      meta = {
        mode: 'offset',
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        queryTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        paginationTimeMs: Math.round(sliceTime * 100) / 100,
      };
    } else {
      // Режим cursor-пагинації (більш продуктивний для великих даних)
      const startSlice = performance.now();
      // Отримуємо на один запис більше, щоб перевірити, чи є ще дані
      const logs = await this.prisma.log.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'desc' },
      });
      const sliceTime = performance.now() - startSlice;

      // Перевіряємо, чи є ще записи для наступної сторінки
      const hasMore = logs.length > limit;
      if (hasMore) logs.pop(); // Видаляємо зайвий запис

      // ID останнього запису для наступної ітерації
      const nextCursor = hasMore ? logs[logs.length - 1].id : null;
      const total = await this.prisma.log.count({ where });

      data = logs;
      // Метадані для cursor-пагінації
      meta = {
        mode: 'cursor',
        limit,
        cursor: cursor || null,
        nextCursor,
        hasMore,
        total,
        queryTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        paginationTimeMs: Math.round(sliceTime * 100) / 100,
      };
    }

    return { data, meta };
  }

  /**
   * Порівняння продуктивності двох типів пагінації
   * Виконує EXPLAIN ANALYZE для offset та cursor запитів
   * та показує різницю в часі виконання
   */
  async explain(dto: GetLogsDto) {
    // Беремо 500-ту сторінку для порівняння (на великих сторінках різниця помітніша)
    const targetPage = dto.page || 500;
    const limit = 100;
    const offsetIdx = (targetPage - 1) * limit;

    // SQL-запит для offset-пагінації з планом виконання
    const offsetQuery = `EXPLAIN ANALYZE SELECT * FROM logs ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offsetIdx}`;
    // SQL-запит для курсорної пагінації з планом виконання
    const cursorQuery = `EXPLAIN ANALYZE SELECT * FROM logs WHERE id < (SELECT id FROM logs ORDER BY id DESC LIMIT 1 OFFSET ${offsetIdx}) ORDER BY id DESC LIMIT ${limit}`;

    // Паралельно виконуємо обидва запити для порівняння
    const [offsetExplain, cursorExplain] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(offsetQuery),
      this.prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(cursorQuery),
    ]);

    // Функція для вилучення часу виконання з плану запиту
    const extractTime = (explain: any[]) => {
      const execTimeLine = explain.find((row) =>
        row['QUERY PLAN'].includes('Execution Time'),
      );
      const match = execTimeLine
        ? execTimeLine['QUERY PLAN'].match(/(\d+\.\d+)/)
        : null;
      return match ? parseFloat(match[0]) : 0;
    };

    const offsetTime = extractTime(offsetExplain);
    const cursorTime = extractTime(cursorExplain);

    // Повертаємо детальну інформацію про продуктивність обох методів
    return {
      targetPage,
      offset: {
        queryTimeMs: offsetTime,
        explain: offsetExplain.map((r) => r['QUERY PLAN']),
      },
      cursor: {
        queryTimeMs: cursorTime,
        explain: cursorExplain.map((r) => r['QUERY PLAN']),
      },
      speedup: `${(offsetTime / Math.max(cursorTime, 0.01)).toFixed(1)}x faster`,
    };
  }
}
