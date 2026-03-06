import { Controller, Post, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChildExportService } from './child-export.service';

/**
 * Controller for running export via Child Process
 * Endpoint: POST /api/system/child-export
 *
 * Child Process is used to run external programs
 * at the operating system level (archivers, backup utilities, etc.)
 */
@Controller('api/system/child-export')
export class ChildExportController {
  constructor(private readonly exportService: ChildExportService) {}

  /**
   * Run export/archiving via Child Process
   * @returns Export results with filename, size, and execution time
   */
  @Post()
  async startExport() {
    return await this.exportService.runExport();
  }

  /**
   * Endpoint to get list of files in exports folder
   * @returns Array of files with size and creation date information
   */
  @Get('files')
  async getFiles() {
    return await this.exportService.getExportedFiles();
  }

  /**
   * Endpoint to download a specific file
   * @param filename - name of the file to download
   * @param res - Express response object for serving the file
   */
  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    // Get safe file path (protection against Path Traversal)
    const filePath = this.exportService.getFilePathForDownload(filename);

    // Use Express built-in method to serve file to client
    // It automatically sets correct headers (Content-Disposition: attachment)
    res.download(filePath, filename, (err) => {
      if (err) {
        // If client canceled download or an error occurred
        console.error('Download error:', err);
      }
    });
  }
}
