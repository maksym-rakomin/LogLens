import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, Subscriber } from 'rxjs';

/**
 * Service for log analysis
 * Supports two modes: synchronous (instant response) and streaming (SSE)
 * Analyzes errors, distribution by levels, top IP addresses
 */
@Injectable()
export class AnalyzeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Synchronous log analysis
   * Returns complete statistics immediately
   * Used for small data volumes
   */
  async analyzeSync() {
    const start = performance.now();
    // Keywords for searching errors in log messages
    const errorKeywords = [
      'timeout',
      'failed',
      'exception',
      'crashed',
      'error',
    ];
    // Build search condition: message contains any of the keywords
    const errorWhere = {
      OR: errorKeywords.map((kw) => ({
        message: { contains: kw, mode: 'insensitive' as const },
      })),
    };

    // Execute 6 queries in parallel to collect all statistics
    const [
      totalLogs,
      uniqueIpsResult,
      errorMatches,
      levelGroup,
      serviceGroup,
      topIpsGroup,
    ] = await Promise.all([
      // Total log count
      this.prisma.log.count(),
      // Count of unique IP addresses
      this.prisma.$queryRaw<
        { count: bigint }[]
      >`SELECT COUNT(DISTINCT ip) FROM logs`,
      // Count of entries with errors (by keywords)
      this.prisma.log.count({ where: errorWhere }),
      // Distribution by log levels
      this.prisma.log.groupBy({ by: ['level'], _count: true }),
      // Distribution by services
      this.prisma.log.groupBy({ by: ['service'], _count: true }),
      // Top 10 IP addresses by request count
      this.prisma.log.groupBy({
        by: ['ip'],
        _count: { ip: true },
        orderBy: { _count: { ip: 'desc' } },
        take: 10,
      }),
    ]);

    // Convert results to convenient format
    const levelCounts = levelGroup.reduce(
      (acc, curr) => ({ ...acc, [curr.level]: curr._count }),
      {},
    );
    const serviceCounts = serviceGroup.reduce(
      (acc, curr) => ({ ...acc, [curr.service]: curr._count }),
      {},
    );
    const topIPs = topIpsGroup.map((g) => ({ ip: g.ip, count: g._count.ip }));

    // Return full report with execution time
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
   * Streaming log analysis via Server-Sent Events (SSE)
   * Sends intermediate results to client as they become ready
   * Allows showing analysis progress in real-time
   */
  analyzeStream(): Observable<MessageEvent> {
    return new Observable((subscriber: Subscriber<MessageEvent>) => {
      const totalStart = performance.now();
      // Helper function to send analysis steps to client
      const sendStep = (step: string, data: any) =>
        subscriber.next({ data: { step, ...data } } as MessageEvent);

      (async () => {
        try {
          // Step 1: Get total log count
          const totalLogs = await this.prisma.log.count();
          sendStep('start', { message: 'Starting analysis...', totalLogs });

          // Step 2: Count unique IP addresses (20% progress)
          const uniqueIpsResult = await this.prisma.$queryRaw<
            { count: bigint }[]
          >`SELECT COUNT(DISTINCT ip) FROM logs`;
          sendStep('unique_ips', {
            message: `Found ${uniqueIpsResult[0].count} unique IP addresses`,
            uniqueIPs: Number(uniqueIpsResult[0].count),
            progress: 20,
          });

          // Step 3: Search for entries with errors by keywords (40% progress)
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

          // Step 4: Calculate distribution by log levels (60% progress)
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

          // Step 5: Calculate distribution by services (80% progress)
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

          // Step 6: Get top 10 IP addresses and complete analysis (100% progress)
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
