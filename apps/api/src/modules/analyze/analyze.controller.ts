import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyzeService } from './analyze.service';

/**
 * Контролер для аналізу логів
 * Обробляє запити на ендпоінт /api/analyze
 * Підтримує два режими роботи через параметр mode
 */
@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  /**
   * Обробка запиту на аналіз
   * @param mode - режим роботи: 'sync' (JSON) або 'stream' (SSE)
   * @param res - об'єкт відповіді Express для ручного керування
   */
  @Get()
  async analyze(@Query('mode') mode: string, @Res() res: Response) {
    // Синхронний режим – повертаємо звичайний JSON відразу
    if (mode === 'sync') {
      const data = await this.analyzeService.analyzeSync();
      return res.json(data);
    } else {
      // Потоковий режим - налаштовуємо заголовки для Server-Sent Events
      // Браузер буде отримувати дані по мірі їх готовності
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream$ = this.analyzeService.analyzeStream();

      // Підписуємося на потік і надсилаємо дані клієнту
      stream$.subscribe({
        next: (msg) => res.write(`data: ${JSON.stringify(msg.data)}\n\n`),
        complete: () => res.end(),
        error: () => res.end(),
      });
    }
  }
}
