import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

/**
 * Stats Module - responsible for collecting and providing statistics
 * Combines service (business logic) and controller (HTTP endpoints)
 * Imported into AppModule for integration into the application
 */
@Module({
  controllers: [StatsController], // Controller handles HTTP requests
  providers: [StatsService], // Service contains business logic
})
export class StatsModule {}
