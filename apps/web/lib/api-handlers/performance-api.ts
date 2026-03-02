// Сервіс для роботи з System Tasks API
// Винесені запити для чистоти компонентів та централізації логіки

// Отримуємо базовий URL нашого бекенду
const API_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000';

export const PerformanceApi = {
  /**
   * Запуск аналізу логів через Worker Thread
   * Worker Thread виконує важкі обчислення в окремому потоці Node.js
   * Не блокує основний Event Loop сервера
   *
   * @returns Результати аналізу: кількість проаналізованих записів,
   *          знайдені помилки, попередження та час виконання
   */
  getAnalyzeSync: async () => {
    const response = await fetch(`${API_URL}/api/analyze?mode=sync`, {
      method: 'GET',
    });
    if (!response.ok) throw new Error('Error fetching data analyze');
    return response.json();
  },

  getAnalyzeStream: async () => {
    const response = await fetch(`${API_URL}/api/analyze?mode=stream`);

    return response.body?.getReader()
  },

};
