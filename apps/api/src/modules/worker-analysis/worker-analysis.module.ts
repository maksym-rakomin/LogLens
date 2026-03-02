import { Module } from '@nestjs/common';
import { WorkerAnalysisController } from './worker-analysis.controller';
import { WorkerAnalysisService } from './worker-analysis.service';

/**
 * Модуль Worker Analysis - відповідає за аналіз логів у Worker Threads
 *
 * Worker Threads - це потоки Node.js для паралельного виконання важких обчислень
 * Використовуються коли потрібно:
 * - Обробити великий обсяг даних без блокування основного потоку
 * - Виконати складні математичні операції
 * - Провести інтенсивний текстовий аналіз
 *
 * На відміну від Child Process, Worker Threads:
 * - Працюють всередині того ж процесу Node.js
 * - Мають спільну пам'ять через SharedArrayBuffer
 * - Легші за ресурсами ніж окремий процес ОС
 */
@Module({
  controllers: [WorkerAnalysisController],
  providers: [WorkerAnalysisService],
})
export class WorkerAnalysisModule {}
