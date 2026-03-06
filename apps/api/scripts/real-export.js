// This is an independent Node.js process. It has its own memory and doesn't block NestJS.
// Used for real export and archiving of logs from PostgreSQL
//
// IPC (Inter-Process Communication) is used for communication with the main process
const { Pool } = require('pg');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Load environment variables (to get DATABASE_URL)
require('dotenv').config();

async function runExport() {
  // 1. Connect to database directly via pg (without Prisma, for speed)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 2. Generate filename and path to exports folder in project root
  const fileName = process.argv[2] || `logs_backup_${Date.now()}.json.gz`;
  const exportDir = path.join(process.cwd(), 'exports');
  const filePath = path.join(exportDir, fileName);

  // Create exports folder if it doesn't exist yet
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const client = await pool.connect();
  try {
    // 3. Extract all logs from database (this can be a heavy query)
    const result = await client.query('SELECT * FROM logs');

    // 4. Create streams for archiving and writing to file
    const gzip = zlib.createGzip();
    const outStream = fs.createWriteStream(filePath);

    // Connect archiver to file
    gzip.pipe(outStream);

    // Convert data to JSON and send to archiver
    gzip.write(JSON.stringify(result.rows));
    gzip.end(); // Complete archiving

    // 5. When file is fully written, return result
    outStream.on('finish', () => {
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      if (process.send) {
        process.send({
          file: fileName,
          size: `${sizeInMB} MB`,
          records: result.rows.length,
          path: filePath,
          status: 'Archived successfully'
        });
      }

      process.exit(0); // Successfully complete process
    });

  } catch (error) {
    // Send error through the same IPC channel
    if (process.send) {
      process.send({ error: error.message });
    }
    process.exit(1); // Complete process with error
  } finally {
    client.release();
    await pool.end();
  }
}

runExport();
