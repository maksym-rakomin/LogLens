import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';

/**
 * Модуль Analyze - відповідає за поглиблений аналіз логів
 * Підтримує синхронний та потоковий (SSE) режими роботи
 * Об'єднує сервіс (бізнес-логіка) та контролер (HTTP-ендпойнти)
 * Імпортується в AppModule для підключення до додатку
 */
@Module({
  controllers: [AnalyzeController], // Контролер обробляє HTTP-запити
  providers: [AnalyzeService], // Сервіс містить бізнес-логіку
})
export class AnalyzeModule {}
