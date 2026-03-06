// Service for working with System Tasks API
// Extracted requests for component cleanliness and logic centralization

// Get base URL of our backend
const API_URL = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000';

export const SystemApi = {
  /**
   * Run log analysis via Worker Thread
   * Worker Thread performs heavy computations in a separate Node.js thread
   * Doesn't block the main server Event Loop
   *
   * @returns Analysis results: number of analyzed records,
   *          found errors, warnings, and execution time
   */
  runWorkerAnalysis: async () => {
    const response = await fetch(`${API_URL}/api/system/worker-analysis`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Worker Analysis failed');
    return response.json();
  },

  /**
   * Run export via Child Process
   * Child Process launches a separate OS process to run external utilities
   * Uses fork for IPC communication (object transmission instead of text)
   * Ideal for archiving, backups, calling system programs
   *
   * @returns Export results: filename, size, record count, and execution time
   */
  runChildProcessExport: async () => {
    const response = await fetch(`${API_URL}/api/system/child-export`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Child Process failed');
    return response.json();
  },

  /**
   * Get list of files from backend
   * @returns Array of files with size and creation date information
   */
  getExportFiles: async () => {
    const response = await fetch(`${API_URL}/api/system/child-export/files`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  /**
   * Generate direct download link
   * Used in <a href="..."> for file downloads
   * @param filename - name of file to download
   * @returns Full URL link to download endpoint
   */
  getDownloadUrl: (filename: string) => {
    return `${API_URL}/api/system/child-export/download/${filename}`;
  },
};
