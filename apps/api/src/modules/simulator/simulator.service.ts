// Підключаємо декоратори NestJS для створення сервісу
import { Injectable, Logger } from '@nestjs/common';
// Імпортуємо декоратор Interval — він запускає код через задані проміжки часу
import { Interval } from '@nestjs/schedule';
// Підключаємо сервіс бази даних для запису логів
import { PrismaService } from '../prisma/prisma.service';
// Імпортуємо тип рівня логу (INFO, WARN, ERROR, DEBUG)
import { LogLevel } from '../../../generated/prisma/client';

// Список сервісів, від імені яких генеруватимуться логи
const SERVICES = [
  'api-gateway',
  'auth-service',
  'payment-service',
  'user-service',
  'notification-service',
];

// Повідомлення для кожного рівня логу
// INFO — звичайні події, WARN — попередження, ERROR — помилки, DEBUG — відлагоджувальна інформація
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

// Ймовірності появи кожного рівня логів
// INFO — 50%, DEBUG — 25%, WARN — 15%, ERROR — 10%
const LEVEL_WEIGHTS: [LogLevel, number][] = [
  ['INFO', 0.5],
  ['DEBUG', 0.25],
  ['WARN', 0.15],
  ['ERROR', 0.1],
];

// Декоратор @Injectable() робить клас доступним для впровадження залежностей NestJS
@Injectable()
export class SimulatorService {
  // Логер для виведення повідомлень у консоль сервера
  private readonly logger = new Logger(SimulatorService.name);

  // Конструктор приймає сервіс бази даних через впровадження залежностей
  constructor(private readonly prisma: PrismaService) {}

  // Метод обирає випадковий рівень лога на основі заданих ймовірностей
  private pickLevel(): LogLevel {
    const r = Math.random();
    let cumulative = 0;
    for (const [level, weight] of LEVEL_WEIGHTS) {
      cumulative += weight;
      if (r <= cumulative) return level;
    }
    return 'INFO';
  }

  // Метод генерує випадкову IP-адресу у форматі xxx.xxx.xxx.xxx
  private generateIP(): string {
    return `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
  }

  // Метод генерує випадковий ідентифікатор запиту у форматі req_xxx...
  private generateRequestId(): string {
    const chars = 'abcdef0123456789';
    let id = 'req_';
    for (let i = 0; i < 12; i++)
      id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  // Декоратор @Interval(1000) запускає метод кожну секунду (1000 мс)
  @Interval(1000)
  async generateLiveLog() {
    // Вибираємо випадковий рівень логу
    const level = this.pickLevel();
    // Вибираємо випадковий сервіс
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    // Вибираємо випадкове повідомлення для вибраного рівня
    const message =
      MESSAGES[level][Math.floor(Math.random() * MESSAGES[level].length)];

    try {
      // Створюємо новий запис журналу в базі даних
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
      // Якщо сталася помилка — записуємо її до лог сервера
      this.logger.error('Failed to insert live log', error);
    }
  }
}
