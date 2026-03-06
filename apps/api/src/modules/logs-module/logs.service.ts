import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetLogsDto } from '../../common/dto/get-logs.dto';
import { Log, Prisma } from '../../../generated/prisma/client';

/**
 * Service for working with logs
 * Responsible for retrieving logs and analyzing query performance
 */
@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get list of logs with filtering and pagination
   * Supports two modes: offset (classic page-based pagination)
   * and cursor (fast pagination for large data volumes)
   */
  async getLogs(dto: GetLogsDto) {
    // Start timer to measure query execution time
    const startTime = performance.now();
    // Extract parameters from request and convert to correct types
    // Query parameters always come as strings, so we explicitly convert
    const limit = Number(dto.limit) || 100;
    const page = Number(dto.page) || 1;
    const { mode, level, service, search, from, to, cursor } = dto;

    // Build filter conditions for database
    const where: Prisma.LogWhereInput = {};
    // Filter by log level (INFO, WARN, ERROR, DEBUG)
    if (level !== 'ALL') where.level = level as any;
    // Filter by service name
    if (service !== 'ALL') where.service = service;
    // Search by message text (case-insensitive)
    if (search) where.message = { contains: search, mode: 'insensitive' };
    // Filter by time range
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    let data: Log[] = [];
    let meta: any = {};

    // Classic page-based pagination mode
    if (mode === 'offset') {
      // Calculate number of records to skip
      const skip = (page - 1) * limit;
      const startSlice = performance.now();

      // Get logs and total count in parallel
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
      // Metadata for offset pagination
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
      // Cursor pagination mode (more performant for large data)
      const startSlice = performance.now();

      // Convert cursor from string to number (if present)
      // Query parameters always come as strings, so we explicitly convert
      const cursorId = cursor ? Number(cursor) : null;

      // Get one more record to check if there's more data
      const logs = await this.prisma.log.findMany({
        where,
        take: limit + 1,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy: { id: 'desc' },
      });
      const sliceTime = performance.now() - startSlice;

      // Check if there are more records for next page
      const hasMore = logs.length > limit;
      if (hasMore) logs.pop(); // Remove extra record

      // ID of last record for next iteration
      const nextCursor = hasMore ? logs[logs.length - 1].id : null;
      const total = await this.prisma.log.count({ where });

      data = logs;
      // Metadata for cursor pagination
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
   * Compare performance of two pagination types
   * Executes EXPLAIN ANALYZE for offset and cursor queries
   * and shows the difference in execution time
   */
  async explain(dto: GetLogsDto) {
    // Take page 500 for comparison (difference is more noticeable on large pages)
    const targetPage = dto.page || 500;
    const limit = 100;
    const offsetIdx = (targetPage - 1) * limit;

    // SQL query for offset pagination with execution plan
    const offsetQuery = `EXPLAIN ANALYZE SELECT * FROM logs ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offsetIdx}`;
    // SQL query for cursor pagination with execution plan
    const cursorQuery = `EXPLAIN ANALYZE SELECT * FROM logs WHERE id < (SELECT id FROM logs ORDER BY id DESC LIMIT 1 OFFSET ${offsetIdx}) ORDER BY id DESC LIMIT ${limit}`;

    // Execute both queries in parallel for comparison
    const [offsetExplain, cursorExplain] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(offsetQuery),
      this.prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(cursorQuery),
    ]);

    // Function to extract execution time from query plan
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

    // Return detailed performance information for both methods
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
