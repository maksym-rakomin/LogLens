// Сервіс для роботи з System Tasks API
// Винесені запити для чистоти компонентів та централізації логіки

// Отримуємо базовий URL нашого бекенду
const API_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000';

export const SystemApi = {
  /**
   * Запуск аналізу логів через Worker Thread
   * Worker Thread виконує важкі обчислення в окремому потоці Node.js
   * Не блокує основний Event Loop сервера
   *
   * @returns Результати аналізу: кількість проаналізованих записів,
   *          знайдені помилки, попередження та час виконання
   */
  runWorkerAnalysis: async () => {
    const response = await fetch(`${API_URL}/api/system/worker-analysis`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Worker Analysis failed');
    return response.json();
  },

  /**
   * Запуск експорту через Child Process
   * Child Process запускає окремий процес ОС для виконання зовнішніх утиліт
   * Використовує fork для IPC зв'язку (передача об'єктів замість тексту)
   * Ідеально для архівації, бекапів, виклику системних програм
   *
   * @returns Результати експорту: ім'я файлу, розмір, кількість записів та час виконання
   */
  runChildProcessExport: async () => {
    const response = await fetch(`${API_URL}/api/system/child-export`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Child Process failed');
    return response.json();
  },

  /**
   * Отримуємо список файлів з бекенду
   * @returns Масив файлів з інформацією про розмір та дату створення
   */
  getExportFiles: async () => {
    const response = await fetch(`${API_URL}/api/system/child-export/files`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  /**
   * Формуємо пряме посилання для скачування
   * Використовується в <a href="..."> для завантаження файлів
   * @param filename - ім'я файлу для скачування
   * @returns Повне URL посилання на ендпоінт скачування
   */
  getDownloadUrl: (filename: string) => {
    return `${API_URL}/api/system/child-export/download/${filename}`;
  },
};
