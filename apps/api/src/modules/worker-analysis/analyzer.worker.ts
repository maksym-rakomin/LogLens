import { parentPort } from 'worker_threads';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables to get access to DATABASE_URL
dotenv.config();

interface Log {
  level: string;
  service: string;
  ip: string;
  message: string;
}

async function runRealAnalysis() {
  // 1. Worker creates its OWN database connection.
  // We use 'pg' directly (without Prisma), as it's faster and consumes less memory in the background thread.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // 2. Extract all logs from database (this can be a very large array)
    const result = await client.query('SELECT * FROM logs');
    const logs = result.rows as Log[];

    // Variables for collecting statistics
    let errorCount = 0;
    let warnCount = 0;
    const serviceCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    let regexMatches = 0;

    // 3. DO HEAVY WORK IN MEMORY (CPU-bound task)
    // Instead of doing this via SQL (GROUP BY), we do it in JavaScript,
    // to load the processor and show why this needs to be done in a Worker Thread.
    for (const log of logs) {
      // Count errors and warnings
      if (log.level === 'ERROR') errorCount++;
      if (log.level === 'WARN') warnCount++;

      // Group by services (how many logs each service generated)
      if (!serviceCounts[log.service]) serviceCounts[log.service] = 0;
      serviceCounts[log.service]++;

      // Count IP address activity
      if (!ipCounts[log.ip]) ipCounts[log.ip] = 0;
      ipCounts[log.ip]++;

      // Heavy operation: text search using regular expressions
      if (/timeout|failed|exception|crashed/i.test(log.message)) {
        regexMatches++;
      }
    }

    // 4. Find the most active IP (Top-1)
    let topIp = '';
    let maxIpCount = 0;
    for (const [ip, count] of Object.entries(ipCounts)) {
      if (count > maxIpCount) {
        maxIpCount = count;
        topIp = ip;
      }
    }

    // 5. Send READY RESULT back to main NestJS thread
    // parentPort - this is the communication channel with the main thread
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
    // If an error occurs, pass it to the main thread
    if (parentPort) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      parentPort.postMessage({ error: errorMessage });
    }
  } finally {
    // Be sure to close the database connection to prevent memory leaks
    client.release();
    await pool.end();
  }
}

// Run function on thread start
runRealAnalysis();
