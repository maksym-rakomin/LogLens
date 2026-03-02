import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module';
import { LogsModule } from './modules/logs-module/logs.module';
import { StatsModule } from './modules/stats/stats.module';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { SimulatorModule } from './modules/simulator/simulator.module';

/**
 * Корневий модуль застосунку
* Об'єднує всі функціональні модулі в єдине ціле
*
* Структура застосунку:
* - ConfigModule - завантаження змінних оточення (.env)
* - ScheduleModule - планувальник завдань (cron)
* - PrismaModule - підключення до бази даних
* - LogsModule - робота з логами (отримання, фільтрація, пагінація)
* - StatsModule - статистика та агрегація даних
* - AnalyzeModule - поглиблений аналіз (синхронний та потоковий)
* - SimulatorModule - симулятор логів (генерація тестових даних)
 */
@Module({
  imports: [
    // Модуль конфігурації - робить доступним process.env у всьому додатку
    ConfigModule.forRoot(),
    // Модуль планувальника - дозволяє запускати завдання за розкладом (cron)
    ScheduleModule.forRoot(),
    PrismaModule,
    // Модуль логів - ендпоінти /api/logs та /api/logs/explain
    LogsModule,
    // Модуль статистики — ендпоінт /api/stats
    StatsModule,
    // Модуль аналізу - ендпойнт /api/analyze (sync/stream)
    AnalyzeModule,
    // Модуль симулятора - генерує тестові лоґи для демонстрації
    SimulatorModule,
  ],
})
export class AppModule {}
