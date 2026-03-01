import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, Subscriber } from 'rxjs';

/**
 * Сервіс для аналізу логів
 * Підтримує два режими: синхронний (миттєва відповідь) та потоковий (SSE)
 * Аналізує помилки, розподіл за рівнями, топ IP-адрес
 */
@Injectable()
export class AnalyzeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Синхронний аналіз логів
   * Миттєво повертає повну статистику
   * Використовується для невеликих обсягів даних
   */
  async analyzeSync() {
    const start = performance.now();
    // Ключові слова для пошуку помилок у повідомленнях логів
    const errorKeywords = [
      'timeout',
      'failed',
      'exception',
      'crashed',
      'error',
    ];
    // Формуємо умову пошуку: повідомлення містить будь-яке з ключових слів
    const errorWhere = {
      OR: errorKeywords.map((kw) => ({
        message: { contains: kw, mode: 'insensitive' as const },
      })),
    };

    // Паралельно виконуємо 6 запитів для збору всієї статистики
    const [
      totalLogs,
      uniqueIpsResult,
      errorMatches,
      levelGroup,
      serviceGroup,
      topIpsGroup,
    ] = await Promise.all([
      // Загальна кількість логів
      this.prisma.log.count(),
      // Кількість унікальних IP-адрес
      this.prisma.$queryRaw<
        { count: bigint }[]
      >`SELECT COUNT(DISTINCT ip) FROM logs`,
      // Кількість записів з помилками (за ключовими словами)
      this.prisma.log.count({ where: errorWhere }),
      // Розподіл за рівнями логування
      this.prisma.log.groupBy({ by: ['level'], _count: true }),
      // Розподіл за сервісами
      this.prisma.log.groupBy({ by: ['service'], _count: true }),
      // Топ-10 IP-адресів за кількістю запитів
      this.prisma.log.groupBy({
        by: ['ip'],
        _count: { ip: true },
        orderBy: { _count: { ip: 'desc' } },
        take: 10,
      }),
    ]);

    // Перетворимо результати у зручний формат
    const levelCounts = levelGroup.reduce(
      (acc, curr) => ({ ...acc, [curr.level]: curr._count }),
      {},
    );
    const serviceCounts = serviceGroup.reduce(
      (acc, curr) => ({ ...acc, [curr.service]: curr._count }),
      {},
    );
    const topIPs = topIpsGroup.map((g) => ({ ip: g.ip, count: g._count.ip }));

    // Повертаємо повний звіт із часом виконання
    // Возвращаем полный отчёт с временем выполнения
    return {
      mode: 'sync',
      totalLogs,
      uniqueIPs: Number(uniqueIpsResult[0].count),
      errorMatches,
      levelCounts,
      serviceCounts,
      topIPs,
      computeTimeMs: Math.round(performance.now() - start),
      blocked: false,
    };
  }

  /**
   * Потоковий аналіз логів через Server-Sent Events (SSE)
   * Відправляє клієнту проміжні результати по мірі готовності
   * Дозволяє показувати прогрес аналізу в реальному часі
   */
  analyzeStream(): Observable<MessageEvent> {
    return new Observable((subscriber: Subscriber<MessageEvent>) => {
      const totalStart = performance.now();
      // Допоміжна функція для надсилання кроків аналізу клієнту
      const sendStep = (step: string, data: any) =>
        subscriber.next({ data: { step, ...data } } as MessageEvent);

      (async () => {
        try {
          // Крок 1: Отримуємо загальну кількість логів
          const totalLogs = await this.prisma.log.count();
          sendStep('start', { message: 'Starting analysis...', totalLogs });

          // Крок 2: Підрахунок унікальних IP-адрес (20% прогрес)
          const uniqueIpsResult = await this.prisma.$queryRaw<
            { count: bigint }[]
          >`SELECT COUNT(DISTINCT ip) FROM logs`;
          sendStep('unique_ips', {
            message: `Found ${uniqueIpsResult[0].count} unique IP addresses`,
            uniqueIPs: Number(uniqueIpsResult[0].count),
            progress: 20,
          });

          // Крок 3: Шукаємо записи з помилками за ключовими словами (40% прогрес)
          const errorKeywords = [
            'timeout',
            'failed',
            'exception',
            'crashed',
            'error',
          ];
          const errorWhere = {
            OR: errorKeywords.map((kw) => ({
              message: { contains: kw, mode: 'insensitive' as const },
            })),
          };
          const errorMatches = await this.prisma.log.count({
            where: errorWhere,
          });
          sendStep('regex_matches', {
            message: `Pattern matched ${errorMatches} log entries`,
            errorMatches,
            progress: 40,
          });

          // Крок 4: Розраховуємо розподіл за рівнями логування (60% прогрес)
          const levelGroup = await this.prisma.log.groupBy({
            by: ['level'],
            _count: true,
          });
          const levelCounts = levelGroup.reduce(
            (acc, curr) => ({ ...acc, [curr.level]: curr._count }),
            {},
          );
          sendStep('level_distribution', {
            message: 'Computed level distribution',
            levelCounts,
            progress: 60,
          });

          // Крок 5: Розрахунок розподілу за сервісами (80% прогресу)
          const serviceGroup = await this.prisma.log.groupBy({
            by: ['service'],
            _count: true,
          });
          const serviceCounts = serviceGroup.reduce(
            (acc, curr) => ({ ...acc, [curr.service]: curr._count }),
            {},
          );
          sendStep('service_distribution', {
            message: 'Computed service distribution',
            serviceCounts,
            progress: 80,
          });

          // Крок 6: Отримуємо топ-10 IP-адрес і завершуємо аналіз (100% прогрес)
          const topIpsGroup = await this.prisma.log.groupBy({
            by: ['ip'],
            _count: { ip: true },
            orderBy: { _count: { ip: 'desc' } },
            take: 10,
          });
          const topIPs = topIpsGroup.map((g) => ({
            ip: g.ip,
            count: g._count.ip,
          }));

          sendStep('complete', {
            message: 'Analysis complete',
            topIPs,
            computeTimeMs: Math.round(performance.now() - totalStart),
            progress: 100,
          });
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}
