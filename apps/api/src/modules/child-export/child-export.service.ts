import { Injectable, NotFoundException } from '@nestjs/common';
import { fork } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Service for running external processes via Child Process
 * Used for executing system utilities and scripts
 *
 * Child Process is a separate operating system process
 * Ideal for:
 * - Running external programs (tar, zip, pg_dump, ffmpeg)
 * - Executing scripts in other languages (Python, Bash, Go)
 * - Isolating tasks that might crash without affecting the main process
 *
 * We use fork instead of exec for Node.js scripts:
 * - fork creates an IPC channel for object transmission
 * - No third-party console logs will break parsing
 * - More efficient for long-running processes
 */
@Injectable()
export class ChildExportService {
  // Path to archives folder
  private readonly exportDir = path.join(process.cwd(), 'exports');

  /**
   * Run export/archiving via Child Process (fork)
   * @returns Promise with export results and execution time
   */
  async runExport() {
    const startTime = performance.now();
    const scriptPath = path.join(process.cwd(), 'scripts', 'real-export.js');
    const backupName = `logs_archive_${Date.now()}.json.gz`;

    // Since fork works on events, wrap it in a Promise
    return new Promise((resolve, reject) => {
      // 1. Launch child process via fork
      // It automatically opens a communication channel (IPC)
      // Second argument is an array of command line arguments
      const child = fork(scriptPath, [backupName]);

      // 2. Listen for messages (objects) sent by process.send() from the script
      child.on(
        'message',
        (result: { error?: string; [key: string]: unknown }) => {
          if (result.error) {
            reject(new Error(result.error));
          } else {
            const timeTaken = Math.round(performance.now() - startTime);
            resolve({
              ...result,
              timeTakenMs: timeTaken,
              type: 'Child Process (fork)',
            });
          }
        },
      );

      // 3. Handle system errors when launching process
      child.on('error', (error) => {
        reject(new Error(`Child process error: ${error.message}`));
      });

      // 4. If process "crashed" or exited with error code
      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Child process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Get list of all generated files in exports folder
   * @returns Array of files with size and creation date information
   */
  async getExportedFiles() {
    // If folder doesn't exist yet, return empty array
    if (!fs.existsSync(this.exportDir)) {
      return [];
    }

    // Read folder contents
    const files = fs.readdirSync(this.exportDir);

    // Build array with information about each file
    const fileDetails = files
      .filter((file) => file.endsWith('.gz')) // Only take archives
      .map((file) => {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime, // Creation time
        };
      })
      // Sort from newest to oldest
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return fileDetails;
  }

  /**
   * Get full path to file for download
   * With security check (protection against Path Traversal attacks)
   * @param filename - name of file to download
   * @returns Full path to file
   * @throws NotFoundException if file doesn't exist
   */
  getFilePathForDownload(filename: string): string {
    // Protection against Path Traversal (so hacker can't pass ../../etc/passwd)
    // path.basename leaves only filename without path
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.exportDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return filePath;
  }
}
