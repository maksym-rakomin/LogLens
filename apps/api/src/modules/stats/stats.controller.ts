import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

/**
 * Controller for retrieving log statistics
 * Handles HTTP requests to /api/stats endpoint
 */
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * Get complete statistics for all logs
   * GET /api/stats
   * Returns: total log count, unique IPs, distribution by levels
   * and services, time-based charts (daily and hourly)
   */
  @Get()
  getStats() {
    return this.statsService.getStats();
  }
}
