// Це незалежний Node.js процес. Він має власну пам'ять і не блокує NestJS.
// Використовується для реального експорту та архівації логів з PostgreSQL
//
// Для зв'язку з основним процесом використовується IPC (Inter-Process Communication)
const { Pool } = require('pg');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Завантажуємо змінні оточення (щоб отримати DATABASE_URL)
require('dotenv').config();

async function runExport() {
  // 1. Підключаємось до бази даних напряму через pg (без Prisma, для швидкості)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 2. Формуємо ім'я файлу та шлях до папки exports у корені проекту
  const fileName = process.argv[2] || `logs_backup_${Date.now()}.json.gz`;
  const exportDir = path.join(process.cwd(), 'exports');
  const filePath = path.join(exportDir, fileName);

  // Створюємо папку exports, якщо її ще немає
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const client = await pool.connect();
  try {
    // 3. Витягуємо всі логи з бази (це може бути важкий запит)
    const result = await client.query('SELECT * FROM logs');

    // 4. Створюємо потоки для архівації та запису у файл
    const gzip = zlib.createGzip();
    const outStream = fs.createWriteStream(filePath);

    // З'єднуємо архіватор із файлом
    gzip.pipe(outStream);

    // Перетворюємо дані в JSON і відправляємо в архіватор
    gzip.write(JSON.stringify(result.rows));
    gzip.end(); // Завершуємо архівацію

    // 5. Коли файл повністю записано, повертаємо результат
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

      process.exit(0); // Успішно завершуємо процес
    });

  } catch (error) {
    // Відправляємо помилку через той самий IPC канал
    if (process.send) {
      process.send({ error: error.message });
    }
    process.exit(1); // Завершуємо процес з помилкою
  } finally {
    client.release();
    await pool.end();
  }
}

runExport();
