import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

/**
 * Контролер для отримання статистики за логами
 * Обробляє HTTP-запити на ендпоінт /api/stats
 */
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * Отримання повної статистики за всіма логами
   * GET /api/stats
   * Повертає: загальну кількість логів, унікальні IP, розподіл за рівнями
   * та сервісами, часові графіки (за днями та годинами)
   */
  @Get()
  getStats() {
    return this.statsService.getStats();
  }
}
