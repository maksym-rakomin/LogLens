import { Controller, Post, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChildExportService } from './child-export.service';

/**
 * Контролер для запуску експорту через Child Process
 * Ендпоінт: POST /api/system/child-export
 *
 * Child Process використовується для запуску зовнішніх програм
 * на рівні операційної системи (архіватори, бекап утиліти, тощо)
 */
@Controller('api/system/child-export')
export class ChildExportController {
  constructor(private readonly exportService: ChildExportService) {}

  /**
   * Запускає експорт/архівацію через Child Process
   * @returns Результати експорту з ім'ям файлу, розміром та часом виконання
   */
  @Post()
  async startExport() {
    return await this.exportService.runExport();
  }

  /**
   * Ендпоінт для отримання списку файлів у папці exports
   * @returns Масив файлів з інформацією про розмір та дату створення
   */
  @Get('files')
  async getFiles() {
    return await this.exportService.getExportedFiles();
  }

  /**
   * Ендпоінт для завантаження конкретного файлу
   * @param filename - ім'я файлу для скачування
   * @param res - об'єкт відповіді Express для віддачі файлу
   */
  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    // Отримуємо безпечний шлях до файлу (захист від Path Traversal)
    const filePath = this.exportService.getFilePathForDownload(filename);

    // Використовуємо вбудований метод Express для віддачі файлу клієнту
    // Він автоматично встановить правильні заголовки (Content-Disposition: attachment)
    res.download(filePath, filename, (err) => {
      if (err) {
        // Якщо клієнт скасував завантаження або сталася помилка
        console.error('Download error:', err);
      }
    });
  }
}
