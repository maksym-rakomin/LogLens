import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module';
import { LogsModule } from './modules/logs-module/logs.module';
import { StatsModule } from './modules/stats/stats.module';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { WorkerAnalysisModule } from './modules/worker-analysis/worker-analysis.module';
import { ChildExportModule } from './modules/child-export/child-export.module';

/**
 * Root module of the application
 * Combines all functional modules into a single unit
 *
 * Application structure:
 * - ConfigModule - loading environment variables (.env)
 * - ScheduleModule - task scheduler (cron)
 * - PrismaModule - database connection
 * - LogsModule - working with logs (retrieval, filtering, pagination)
 * - StatsModule - statistics and data aggregation
 * - AnalyzeModule - in-depth analysis (synchronous and streaming)
 * - SimulatorModule - log simulator (test data generation)
 * - WorkerAnalysisModule - log analysis via Worker Threads (heavy computations)
 * - ChildExportModule - export via Child Process (external OS processes)
 */
@Module({
  imports: [
    // Configuration module - makes process.env available throughout the application
    ConfigModule.forRoot(),
    // Scheduler module - allows running tasks on schedule (cron)
    ScheduleModule.forRoot(),
    PrismaModule,
    // Logs module - endpoints /api/logs and /api/logs/explain
    LogsModule,
    // Statistics module - endpoint /api/stats
    StatsModule,
    // Analysis module - endpoint /api/analyze (sync/stream)
    AnalyzeModule,
    // Simulator module - generates test logs for demonstration
    SimulatorModule,
    // Worker Analysis module - running heavy computations in Worker Threads
    WorkerAnalysisModule,
    // Child Export module - running external processes for export/archiving
    ChildExportModule,
  ],
})
export class AppModule {}
