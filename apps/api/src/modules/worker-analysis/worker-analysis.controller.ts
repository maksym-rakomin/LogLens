import { Controller, Post } from '@nestjs/common';
import { WorkerAnalysisService } from './worker-analysis.service';

/**
 * Controller for running log analysis via Worker Threads
 * Endpoint: POST /api/system/worker-analysis
 *
 * Worker Threads are used for heavy computations inside Node.js
 * They don't block the main Event Loop, allowing the server to handle other requests
 */
@Controller('api/system/worker-analysis')
export class WorkerAnalysisController {
  constructor(private readonly workerService: WorkerAnalysisService) {}

  /**
   * Run log analysis via Worker Thread
   * @returns Analysis results with error count, warnings, and execution time
   */
  @Post()
  async startAnalysis() {
    return await this.workerService.runAnalysis();
  }
}
