// Import Module decorator from NestJS - it creates a module (code block with specific functionality)
import { Module } from '@nestjs/common';
// Import simulator service that will add logs
import { SimulatorService } from './simulator.service';

// @Module decorator describes the module and its components
@Module({
  // providers - list of services that will be available in this module
  providers: [SimulatorService],
})
// Export module class for use in other files
export class SimulatorModule {}
