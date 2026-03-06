import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LogLevel } from '../../../generated/prisma/client';

/**
 * DTO (Data Transfer Object) for log request parameters
 * Automatically validates and transforms request data
 * Used in controllers for handling query parameters
 */
export class GetLogsDto {
  // Pagination mode: 'cursor' (fast) or 'offset' (classic)
  @IsOptional()
  @IsString()
  mode?: 'cursor' | 'offset' = 'cursor';

  // Number of records per page (minimum 1)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  // Log level for filtering (INFO, WARN, ERROR, DEBUG) or 'ALL' for all
  @IsOptional()
  @IsString()
  level?: LogLevel | 'ALL' = 'ALL';

  // Service name for filtering or 'ALL' for all
  @IsOptional()
  @IsString()
  service?: string = 'ALL';

  // Search query for searching in message text
  @IsOptional()
  @IsString()
  search?: string = '';

  // Start of time range (ISO 8601 format)
  @IsOptional()
  @IsString()
  from?: string = '';

  // End of time range (ISO 8601 format)
  @IsOptional()
  @IsString()
  to?: string = '';

  // Page number for offset pagination (minimum 1)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Record ID for cursor pagination (start from this record)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;
}
