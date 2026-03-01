import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Сервіс для отримання статистики за логами
 * Збирає загальну інформацію: кількість логів, розподіл за рівнями,
 * сервісами, часовими періодами
 */
@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Отримання повної статистики за всіма логами
   * Повертає дані для графіків та зведених таблиць
   */
  async getStats() {
    // Паралельно виконуємо 6 незалежних запитів до бази даних
    const [totalLogs, uniqueIpsResult, levelGroup, serviceGroup, timelineRaw, hourlyRaw] = await Promise.all([
      // Загальна кількість усіх логів
      this.prisma.log.count(),
      // Кількість унікальних IP-адрес (прямий SQL-запит)
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(DISTINCT ip) FROM logs`,
      // Групування за рівнями логування (INFO, WARN, ERROR, DEBUG)
      this.prisma.log.groupBy({ by: ['level'], _count: true }),
      // Групування за сервісами
      this.prisma.log.groupBy({ by: ['service'], _count: true }),
      // Розподіл логів за днями та рівнями (для графіка за днями)
      this.prisma.$queryRaw<{ date: Date; level: string; count: bigint }[]>`
        SELECT DATE_TRUNC('day', timestamp) as date, level, COUNT(*) as count 
        FROM logs GROUP BY 1, 2 ORDER BY 1 ASC
      `,
      // Розподіл логів за годинами та рівнями (для графіка погодинно)
      this.prisma.$queryRaw<{ hour: number; level: string; count: bigint }[]>`
        SELECT EXTRACT(HOUR FROM timestamp) as hour, level, COUNT(*) as count 
        FROM logs GROUP BY 1, 2
      `
    ]);

    // Перетворимо результати групування за рівнями в об'єкт { INFO: 100, WARN: 50, ... }
    const levelCounts = levelGroup.reduce((acc, curr) => ({ ...acc, [curr.level]: curr._count }), {});
    // Перетворимо результати групування за сервісами в об'єкт { "auth-service": 200, ... }
    const serviceCounts = serviceGroup.reduce((acc, curr) => ({ ...acc, [curr.service]: curr._count }), {});

    // Створюємо карту для групування даних за днями
    const dayMap = new Map<string, any>();
    timelineRaw.forEach(row => {
      const day = row.date.toISOString().slice(0, 10); // Вилучаємо дату у форматі YYYY-MM-DD
      // Створюємо запис для дня, якщо його ще немає
      if (!dayMap.has(day)) dayMap.set(day, { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 });
      // Додаємо кількість логів для відповідного рівня
      dayMap.get(day)[row.level] = Number(row.count);
    });
    // Перетворимо карту в масив для відповіді клієнту
    const timeline = Array.from(dayMap.entries()).map(([date, counts]) => ({
      date, ...counts, total: Object.values(counts).reduce((a: any, b: any) => a + b, 0),
    }));

    // Створюємо масив з 24 годин з нульовими значеннями
    const hourMap = new Array(24).fill(0).map(() => ({ INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 }));
    hourlyRaw.forEach(row => {
      // Заповнюємо даними з бази відповідні години
      hourMap[Number(row.hour)][row.level] = Number(row.count);
    });
    // Перетворюємо у формат для клієнта з гарним відображенням годинника
    const hourly = hourMap.map((counts, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));

    // Повертаємо всю зібрану статистику
    return {
      totalLogs,
      uniqueIPs: Number(uniqueIpsResult[0].count),
      levelCounts, serviceCounts, timeline, hourly,
    };
  }
}
