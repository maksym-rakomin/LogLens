import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

@Injectable()
export class WorkerAnalysisService {
  async runAnalysis() {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      // Вказуємо шлях до скомпільованого файлу worker'а (.js)
      // NestJS компілює всі .ts файли у папку dist
      const workerPath = path.join(__dirname, 'analyzer.worker.js');

      // 1. Запускаємо новий потік.
      // Ми більше не передаємо йому workerData, бо він сам сходить у базу!
      const worker = new Worker(workerPath);

      // 2. Слухаємо повідомлення від Worker'а
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

      // 3. Обробляємо системні помилки потоку
      worker.on('error', (error) => reject(error));

      // 4. Обробляємо непередбачуване завершення
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }
}
