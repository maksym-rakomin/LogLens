import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyzeService } from './analyze.service';

/**
 * Controller for log analysis
 * Handles requests to /api/analyze endpoint
 * Supports two operation modes via mode parameter
 */
@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  /**
   * Handle analysis request
   * @param mode - operation mode: 'sync' (JSON) or 'stream' (SSE)
   * @param res - Express response object for manual control
   */
  @Get()
  async analyze(@Query('mode') mode: string, @Res() res: Response) {
    // Synchronous mode - return regular JSON immediately
    if (mode === 'sync') {
      const data = await this.analyzeService.analyzeSync();
      return res.json(data);
    } else {
      // Streaming mode - set headers for Server-Sent Events
      // Browser will receive data as it becomes ready
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream$ = this.analyzeService.analyzeStream();

      // Subscribe to stream and send data to client
      stream$.subscribe({
        next: (msg) => res.write(`data: ${JSON.stringify(msg.data)}\n\n`),
        complete: () => res.end(),
        error: () => res.end(),
      });
    }
  }
}
