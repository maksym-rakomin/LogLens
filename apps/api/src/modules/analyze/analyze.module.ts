import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';

/**
 * Analyze Module - responsible for in-depth log analysis
 * Supports synchronous and streaming (SSE) operation modes
 * Combines service (business logic) and controller (HTTP endpoints)
 * Imported into AppModule for integration into the application
 */
@Module({
  controllers: [AnalyzeController], // Controller handles HTTP requests
  providers: [AnalyzeService], // Service contains business logic
})
export class AnalyzeModule {}
