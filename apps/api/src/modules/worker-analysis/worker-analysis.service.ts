import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

@Injectable()
export class WorkerAnalysisService {
  async runAnalysis() {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      // Specify path to compiled worker file (.js)
      // NestJS compiles all .ts files to dist folder
      const workerPath = path.join(__dirname, 'analyzer.worker.js');

      // 1. Launch new thread.
      // We no longer pass workerData to it, as it will go to the database itself!
      const worker = new Worker(workerPath);

      // 2. Listen for messages from Worker
      worker.on(
        'message',
        (result: { error?: string; [key: string]: unknown }) => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            const timeTaken = Math.round(performance.now() - startTime);
            resolve({
              ...result,
              timeTakenMs: timeTaken,
              type: 'Worker Thread',
            });
          }
        },
      );

      // 3. Handle system thread errors
      worker.on('error', (error) => reject(error));

      // 4. Handle unexpected termination
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }
}
