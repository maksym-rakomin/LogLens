import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { GetLogsDto } from '../../common/dto/get-logs.dto';

/**
 * Controller for managing logs
 * Handles HTTP requests to /api/logs endpoints
 */
@Controller('api/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * Get list of logs with filtering and pagination
   * GET /api/logs?mode=cursor&limit=50&level=ERROR&service=auth&search=error
   */
  @Get()
  getLogs(@Query() query: GetLogsDto) {
    return this.logsService.getLogs(query);
  }

  /**
   * Compare pagination performance
   * GET /api/logs/explain?page=500
   * Returns SQL query execution plans for offset and cursor pagination
   */
  @Get('explain')
  explain(@Query() query: GetLogsDto) {
    return this.logsService.explain(query);
  }
}
