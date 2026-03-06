import { Module } from '@nestjs/common';
import { WorkerAnalysisController } from './worker-analysis.controller';
import { WorkerAnalysisService } from './worker-analysis.service';

/**
 * Worker Analysis Module - responsible for log analysis in Worker Threads
 *
 * Worker Threads are Node.js threads for parallel execution of heavy computations
 * Used when you need to:
 * - Process large volumes of data without blocking the main thread
 * - Perform complex mathematical operations
 * - Conduct intensive text analysis
 *
 * Unlike Child Process, Worker Threads:
 * - Run inside the same Node.js process
 * - Share memory via SharedArrayBuffer
 * - Are lighter on resources than a separate OS process
 */
@Module({
  controllers: [WorkerAnalysisController],
  providers: [WorkerAnalysisService],
})
export class WorkerAnalysisModule {}
