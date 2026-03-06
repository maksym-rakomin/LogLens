import { Module } from '@nestjs/common';
import { ChildExportController } from './child-export.controller';
import { ChildExportService } from './child-export.service';

/**
 * Child Export Module - responsible for export and archiving via Child Process
 *
 * Child Process - running separate operating system processes
 * Used when you need to:
 * - Run an external program (tar, zip, pg_dump, ffmpeg)
 * - Execute a script in another language (Python, Bash, Go)
 * - Isolate a task that might crash without affecting the main process
 *
 * Unlike Worker Threads, Child Process:
 * - Runs as a separate OS process with its own memory
 * - Can run any programs available in the system
 * - Heavier on resources, but more isolated
 */
@Module({
  controllers: [ChildExportController],
  providers: [ChildExportService],
})
export class ChildExportModule {}
