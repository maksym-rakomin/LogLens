// Service for working with System Tasks API
// Extracted requests for component cleanliness and logic centralization

// Get base URL of our backend
const API_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000';

export const PerformanceApi = {
  /**
   * Run log analysis via Worker Thread
   * Worker Thread performs heavy computations in a separate Node.js thread
   * Doesn't block the main server Event Loop
   *
   * @returns Analysis results: number of analyzed records,
   *          found errors, warnings, and execution time
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
