import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { LogLevel, Prisma, PrismaClient } from '../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const SERVICES = [
  'api-gateway',
  'auth-service',
  'payment-service',
  'user-service',
  'notification-service',
];

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

const LEVEL_WEIGHTS: [LogLevel, number][] = [
  ['INFO', 0.5],
  ['DEBUG', 0.25],
  ['WARN', 0.15],
  ['ERROR', 0.1],
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickLevel(rand: () => number): LogLevel {
  const r = rand();
  let cumulative = 0;
  for (const [level, weight] of LEVEL_WEIGHTS) {
    cumulative += weight;
    if (r <= cumulative) return level;
  }
  return 'INFO';
}

function generateIP(rand: () => number) {
  return `${Math.floor(rand() * 200) + 10}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 254) + 1}`;
}

function generateRequestId(rand: () => number) {
  const chars = 'abcdef0123456789';
  let id = 'req_';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(rand() * chars.length)];
  return id;
}

// Add this helper to create the batch in a isolated scope
function generateBatch(
  size: number,
  startIdx: number,
  rand: () => number,
  now: number,
  thirtyDaysMs: number,
): Prisma.LogCreateManyInput[] {
  const batch: Prisma.LogCreateManyInput[] = [];
  for (let j = 0; j < size; j++) {
    const level = pickLevel(rand);
    batch.push({
      timestamp: new Date(now - Math.floor(rand() * thirtyDaysMs)),
      level,
      service: SERVICES[Math.floor(rand() * SERVICES.length)],
      message: MESSAGES[level][Math.floor(rand() * MESSAGES[level].length)],
      ip: generateIP(rand),
      requestId: generateRequestId(rand),
    });
  }
  return batch;
}

async function main() {
  console.log('Cleaning old logs...');
  await prisma.log.deleteMany();

  const COUNT = 500_000;
  const BATCH_SIZE = 10_000;
  const rand = seededRandom(42);
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  console.log(`Generating ${COUNT} logs...`);

  for (let i = 0; i < COUNT; i += BATCH_SIZE) {
    const limit = Math.min(BATCH_SIZE, COUNT - i);

    // 1. Generate and Send immediately
    const batch = generateBatch(limit, i, rand, now, thirtyDaysMs);
    await prisma.log.createMany({ data: batch });

    console.log(`Inserted ${i + limit} / ${COUNT}`);

    // 2. Allow GC to run by yielding the event loop every 5 batches
    if (i % (BATCH_SIZE * 5) === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  console.log('Seed complete!');
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
