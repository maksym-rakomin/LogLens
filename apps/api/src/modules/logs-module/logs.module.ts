import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

/**
 * Logs Module - responsible for working with logs
 * Combines service (business logic) and controller (HTTP endpoints)
 * Imported into AppModule for integration into the application
 */
@Module({
  controllers: [LogsController], // Controller handles HTTP requests
  providers: [LogsService], // Service contains business logic
})
export class LogsModule {}
