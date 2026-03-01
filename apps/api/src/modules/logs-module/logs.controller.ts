import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { GetLogsDto } from '../../common/dto/get-logs.dto';

/**
 * Контролер для керування логами
 * Обробляє HTTP-запити на ендпоінти /api/logs
 */
@Controller('api/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * Отримання списку логів із фільтрацією та пагінацією
   * GET /api/logs?mode=cursor&limit=50&level=ERROR&service=auth&search=error
   */
  @Get()
  getLogs(@Query() query: GetLogsDto) {
    return this.logsService.getLogs(query);
  }

  /**
   * Порівняння продуктивності пагінації
   * GET /api/logs/explain?page=500
   * Повертає план виконання SQL-запитів для offset та cursor пагінації
   */
  @Get('explain')
  explain(@Query() query: GetLogsDto) {
    return this.logsService.explain(query);
  }
}
