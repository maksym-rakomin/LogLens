import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for retrieving log statistics
 * Collects general information: log count, distribution by levels,
 * services, and time periods
 */
@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get complete statistics for all logs
   * Returns data for charts and summary tables
   */
  async getStats() {
    // Execute 6 independent database queries in parallel
    const [totalLogs, uniqueIpsResult, levelGroup, serviceGroup, timelineRaw, hourlyRaw] = await Promise.all([
      // Total count of all logs
      this.prisma.log.count(),
      // Count of unique IP addresses (direct SQL query)
      this.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(DISTINCT ip) FROM logs`,
      // Grouping by log levels (INFO, WARN, ERROR, DEBUG)
      this.prisma.log.groupBy({ by: ['level'], _count: true }),
      // Grouping by services
      this.prisma.log.groupBy({ by: ['service'], _count: true }),
      // Distribution of logs by days and levels (for daily chart)
      this.prisma.$queryRaw<{ date: Date; level: string; count: bigint }[]>`
        SELECT DATE_TRUNC('day', timestamp) as date, level, COUNT(*) as count
        FROM logs GROUP BY 1, 2 ORDER BY 1 ASC
      `,
      // Distribution of logs by hours and levels (for hourly chart)
      this.prisma.$queryRaw<{ hour: number; level: string; count: bigint }[]>`
        SELECT EXTRACT(HOUR FROM timestamp) as hour, level, COUNT(*) as count
        FROM logs GROUP BY 1, 2
      `
    ]);

    // Convert level grouping results to object { INFO: 100, WARN: 50, ... }
    const levelCounts = levelGroup.reduce((acc, curr) => ({ ...acc, [curr.level]: curr._count }), {});
    // Convert service grouping results to object { "auth-service": 200, ... }
    const serviceCounts = serviceGroup.reduce((acc, curr) => ({ ...acc, [curr.service]: curr._count }), {});

    // Create a map for grouping data by days
    const dayMap = new Map<string, any>();
    timelineRaw.forEach(row => {
      const day = row.date.toISOString().slice(0, 10); // Extract date in YYYY-MM-DD format
      // Create an entry for the day if it doesn't exist yet
      if (!dayMap.has(day)) dayMap.set(day, { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 });
      // Add log count for the corresponding level
      dayMap.get(day)[row.level] = Number(row.count);
    });
    // Convert the map to an array for the client response
    const timeline = Array.from(dayMap.entries()).map(([date, counts]) => ({
      date, ...counts, total: Object.values(counts).reduce((a: any, b: any) => a + b, 0),
    }));

    // Create an array of 24 hours with zero values
    const hourMap = new Array(24).fill(0).map(() => ({ INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 }));
    hourlyRaw.forEach(row => {
      // Fill in database data for corresponding hours
      hourMap[Number(row.hour)][row.level] = Number(row.count);
    });
    // Convert to client format with nice time display
    const hourly = hourMap.map((counts, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));

    // Return all collected statistics
    return {
      totalLogs,
      uniqueIPs: Number(uniqueIpsResult[0].count),
      levelCounts, serviceCounts, timeline, hourly,
    };
  }
}
