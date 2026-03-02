import { Controller, Post } from '@nestjs/common';
import { WorkerAnalysisService } from './worker-analysis.service';

/**
 * Контролер для запуску аналізу логів через Worker Threads
 * Ендпоінт: POST /api/system/worker-analysis
 *
 * Worker Threads використовуються для важких обчислень всередині Node.js
 * Не блокують основний Event Loop, дозволяючи серверу обробляти інші запити
 */
@Controller('api/system/worker-analysis')
export class WorkerAnalysisController {
  constructor(private readonly workerService: WorkerAnalysisService) {}

  /**
   * Запускає аналіз логів через Worker Thread
   * @returns Результати аналізу з кількістю помилок, попереджень та часом виконання
   */
  @Post()
  async startAnalysis() {
    return await this.workerService.runAnalysis();
  }
}
