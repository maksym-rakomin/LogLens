import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

/**
 * Модуль Stats - відповідає за збір та надання статистики
 * Об'єднує сервіс (бізнес-логіка) та контролер (HTTP-ендпоінти)
 * Імпортується до AppModule для підключення до додатку
 */
@Module({
  controllers: [StatsController], // Контролер обробляє HTTP-запити
  providers: [StatsService], // Сервіс містить бізнес-логіку
})
export class StatsModule {}
