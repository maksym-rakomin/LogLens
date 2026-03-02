import { Injectable, NotFoundException } from '@nestjs/common';
import { fork } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Сервіс для запуску зовнішніх процесів через Child Process
 * Використовується для виконання системних утиліт та скриптів
 *
 * Child Process - це окремий процес операційної системи
 * Ідеально підходить для:
 * - Запуску зовнішніх програм (tar, zip, pg_dump, ffmpeg)
 * - Виконання скриптів на інших мовах (Python, Bash, Go)
 * - Ізоляції завдань, які можуть впасти без впливу на основний процес
 *
 * Використовуємо fork замість exec для Node.js скриптів:
 * - fork створює IPC канал для передачі об'єктів
 * - Ніякі сторонні логи в консолі не зламають парсинг
 * - Ефективніше для тривалих процесів
 */
@Injectable()
export class ChildExportService {
  // Шлях до папки з архівами
  private readonly exportDir = path.join(process.cwd(), 'exports');

  /**
   * Запускає експорт/архівацію через Child Process (fork)
   * @returns Promise з результатами експорту та часом виконання
   */
  async runExport() {
    const startTime = performance.now();
    const scriptPath = path.join(process.cwd(), 'scripts', 'real-export.js');
    const backupName = `logs_archive_${Date.now()}.json.gz`;

    // Оскільки fork працює на подіях, загортаємо його в Promise
    return new Promise((resolve, reject) => {
      // 1. Запускаємо дочірній процес через fork
      // Він автоматично відкриває канал зв'язку (IPC)
      // Другий аргумент - це масив аргументів командного рядка
      const child = fork(scriptPath, [backupName]);

      // 2. Слухаємо повідомлення (об'єкти), які надсилає process.send() зі скрипта
      child.on(
        'message',
        (result: { error?: string; [key: string]: unknown }) => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            const timeTaken = Math.round(performance.now() - startTime);
            resolve({
              ...result,
              timeTakenMs: timeTaken,
              type: 'Child Process (fork)',
            });
          }
        },
      );

      // 3. Обробляємо системні помилки запуску процесу
      child.on('error', (error) => {
        reject(new Error(`Child process error: ${error.message}`));
      });

      // 4. Якщо процес "впав" або завершився з кодом помилки
      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Child process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Отримуємо список усіх згенерованих файлів у папці exports
   * @returns Масив файлів з інформацією про розмір та дату створення
   */
  async getExportedFiles() {
    // Якщо папки ще немає, повертаємо порожній масив
    if (!fs.existsSync(this.exportDir)) {
      return [];
    }

    // Читаємо вміст папки
    const files = fs.readdirSync(this.exportDir);

    // Формуємо масив з інформацією про кожен файл
    const fileDetails = files
      .filter((file) => file.endsWith('.gz')) // Беремо тільки архіви
      .map((file) => {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime, // Час створення
        };
      })
      // Сортуємо від найновіших до найстаріших
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return fileDetails;
  }

  /**
   * Отримуємо повний шлях до файлу для скачування
   * З перевіркою безпеки (захист від Path Traversal атак)
   * @param filename - ім'я файлу для скачування
   * @returns Повний шлях до файлу
   * @throws NotFoundException якщо файл не існує
   */
  getFilePathForDownload(filename: string): string {
    // Захист від Path Traversal (щоб хакер не передав ../../etc/passwd)
    // path.basename залишає тільки ім'я файлу без шляху
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.exportDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return filePath;
  }
}
