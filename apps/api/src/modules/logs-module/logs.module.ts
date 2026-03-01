import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

/**
 * Модуль Logs - відповідає за роботу з логами
 * Об'єднує сервіс (бізнес-логіка) та контролер (HTTP-ендпоінти)
 * Імпортується в AppModule для підключення до застосунку
 */
@Module({
  controllers: [LogsController], // Контролер обробляє HTTP-запити
  providers: [LogsService], // Сервіс містить бізнес-логіку
})
export class LogsModule {}
