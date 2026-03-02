import { Module } from '@nestjs/common';
import { ChildExportController } from './child-export.controller';
import { ChildExportService } from './child-export.service';

/**
 * Модуль Child Export - відповідає за експорт та архівацію через Child Process
 *
 * Child Process - це запуск окремих процесів операційної системи
 * Використовується коли потрібно:
 * - Запустити зовнішню програму (tar, zip, pg_dump, ffmpeg)
 * - Виконати скрипт на іншій мові (Python, Bash, Go)
 * - Ізолювати завдання, яке може впасти без впливу на основний процес
 *
 * На відміну від Worker Threads, Child Process:
 * - Працює як окремий процес ОС з власною пам'яттю
 * - Може запускати будь-які програми, доступні в системі
 * - Важчий за ресурсами, але більш ізольований
 */
@Module({
  controllers: [ChildExportController],
  providers: [ChildExportService],
})
export class ChildExportModule {}
