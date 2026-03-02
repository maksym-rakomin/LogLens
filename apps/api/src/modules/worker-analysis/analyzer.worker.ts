import { parentPort } from 'worker_threads';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Завантажуємо змінні оточення, щоб отримати доступ до DATABASE_URL
dotenv.config();

interface Log {
  level: string;
  service: string;
  ip: string;
  message: string;
}

async function runRealAnalysis() {
  // 1. Воркер створює ВЛАСНЕ підключення до бази даних.
  // Ми використовуємо 'pg' напряму (без Prisma), бо це швидше і споживає менше пам'яті у фоновому потоці.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // 2. Витягуємо всі логи з бази (це може бути дуже великий масив)
    const result = await client.query('SELECT * FROM logs');
    const logs = result.rows as Log[];

    // Змінні для збору статистики
    let errorCount = 0;
    let warnCount = 0;
    const serviceCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    let regexMatches = 0;

    // 3. РОБИМО ВАЖКУ РОБОТУ В ПАМ'ЯТІ (CPU-bound задача)
    // Замість того, щоб робити це через SQL (GROUP BY), ми робимо це в JavaScript,
    // щоб навантажити процесор і показати, чому це потрібно робити у Worker Thread.
    for (const log of logs) {
      // Рахуємо помилки та попередження
      if (log.level === 'ERROR') errorCount++;
      if (log.level === 'WARN') warnCount++;

      // Групуємо по сервісах (скільки логів згенерував кожен сервіс)
      if (!serviceCounts[log.service]) serviceCounts[log.service] = 0;
      serviceCounts[log.service]++;

      // Рахуємо активність IP-адрес
      if (!ipCounts[log.ip]) ipCounts[log.ip] = 0;
      ipCounts[log.ip]++;

      // Важка операція: пошук по тексту за допомогою регулярних виразів
      if (/timeout|failed|exception|crashed/i.test(log.message)) {
        regexMatches++;
      }
    }

    // 4. Знаходимо найактивніший IP (Топ-1)
    let topIp = '';
    let maxIpCount = 0;
    for (const [ip, count] of Object.entries(ipCounts)) {
      if (count > maxIpCount) {
        maxIpCount = count;
        topIp = ip;
      }
    }

    // 5. Відправляємо ГОТОВИЙ РЕЗУЛЬТАТ назад в основний потік NestJS
    // parentPort - це канал зв'язку з основним потоком
    if (parentPort) {
      parentPort.postMessage({
        status: 'success',
        analyzedCount: logs.length,
        foundErrors: errorCount,
        foundWarns: warnCount,
        regexMatches: regexMatches,
        topIp: topIp,
        topIpCount: maxIpCount,
        uniqueServices: Object.keys(serviceCounts).length,
      });
    }
  } catch (error: unknown) {
    // Якщо сталася помилка, передаємо її в основний потік
    if (parentPort) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      parentPort.postMessage({ error: errorMessage });
    }
  } finally {
    // Обов'язково закриваємо з'єднання з БД, щоб не було витоку пам'яті
    client.release();
    await pool.end();
  }
}

// Запускаємо функцію при старті потоку
runRealAnalysis();
