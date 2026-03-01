import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule],
  imports: [
    // Модуль конфігурації - робить доступним process.env у всьому додатку
    ConfigModule.forRoot(),
    PrismaModule,
    // Модуль логів - ендпоінти /api/logs та /api/logs/explain
    LogsModule,
    // Модуль статистики — ендпоінт /api/stats
    StatsModule,
    // Модуль аналізу - ендпойнт /api/analyze (sync/stream)
    AnalyzeModule,
  ],
})
export class AppModule {}
