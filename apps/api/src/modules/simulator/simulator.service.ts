// Import NestJS decorators for creating a service
import { Injectable, Logger } from '@nestjs/common';
// Import Interval decorator - it runs code at specified intervals
import { Interval } from '@nestjs/schedule';
// Connect database service for log writing
import { PrismaService } from '../prisma/prisma.service';
// Import log level type (INFO, WARN, ERROR, DEBUG)
import { LogLevel } from '../../../generated/prisma/client';

// List of services from which logs will be generated
const SERVICES = [
  'api-gateway',
  'auth-service',
  'payment-service',
  'user-service',
  'notification-service',
];

// Messages for each log level
// INFO - regular events, WARN - warnings, ERROR - errors, DEBUG - debug information
const MESSAGES: Record<LogLevel, string[]> = {
  INFO: [
    'Request processed successfully',
    'User session created',
    'Cache hit for resource',
    'Database connection pool healthy',
    'Scheduled job completed',
    'Configuration reloaded',
    'Health check passed',
    'WebSocket connection established',
    'Rate limit threshold updated',
    'Metric export completed',
  ],
  WARN: [
    'High memory usage detected: 85%',
    'Slow query detected: 1200ms',
    'Rate limit approaching threshold',
    'Certificate expiring in 30 days',
    'Retry attempt 2/3 for external API',
    'Connection pool nearing capacity',
    'Deprecated API version called',
    'Disk usage above 75%',
  ],
  ERROR: [
    'Database connection timeout after 30s',
    'Authentication failed: invalid token',
    'Payment processing failed: gateway error',
    'Unhandled exception in request handler',
    'External API returned 503',
    'Failed to parse JSON payload',
    'Queue consumer crashed unexpectedly',
    'TLS handshake failed',
  ],
  DEBUG: [
    'Entering function processOrder()',
    'SQL query plan: sequential scan',
    'Request headers: content-type=application/json',
    'Cache key generated: usr_a8f3',
    'Event loop lag: 2ms',
    'GC pause: 15ms',
    'Thread pool utilization: 45%',
  ],
};

// Probability weights for each log level
// INFO - 50%, DEBUG - 25%, WARN - 15%, ERROR - 10%
const LEVEL_WEIGHTS: [LogLevel, number][] = [
  ['INFO', 0.5],
  ['DEBUG', 0.25],
  ['WARN', 0.15],
  ['ERROR', 0.1],
];

// @Injectable() decorator makes the class available for NestJS dependency injection
@Injectable()
export class SimulatorService {
  // Logger for outputting messages to server console
  private readonly logger = new Logger(SimulatorService.name);

  // Constructor accepts database service via dependency injection
  constructor(private readonly prisma: PrismaService) {}

  // Method selects a random log level based on specified probabilities
  private pickLevel(): LogLevel {
    const r = Math.random();
    let cumulative = 0;
    for (const [level, weight] of LEVEL_WEIGHTS) {
      cumulative += weight;
      if (r <= cumulative) return level;
    }
    return 'INFO';
  }

  // Method generates a random IP address in xxx.xxx.xxx.xxx format
  private generateIP(): string {
    return `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
  }

  // Method generates a random request identifier in req_xxx... format
  private generateRequestId(): string {
    const chars = 'abcdef0123456789';
    let id = 'req_';
    for (let i = 0; i < 12; i++)
      id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  // @Interval(1000) decorator runs the method every second (1000ms)
  @Interval(1000)
  async generateLiveLog() {
    // Select random log level
    const level = this.pickLevel();
    // Select random service
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    // Select random message for the chosen level
    const message =
      MESSAGES[level][Math.floor(Math.random() * MESSAGES[level].length)];

    try {
      // Create new log entry in database
      await this.prisma.log.create({
        data: {
          level,
          service,
          message,
          ip: this.generateIP(),
          requestId: this.generateRequestId(),
        },
      });
    } catch (error) {
      // If an error occurs - log it to server log
      this.logger.error('Failed to insert live log', error);
    }
  }
}
