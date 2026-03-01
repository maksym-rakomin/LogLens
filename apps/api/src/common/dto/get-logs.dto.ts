import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LogLevel } from '../../../generated/prisma/client';

/**
 * DTO (Data Transfer Object) для параметрів запиту логів
 * Автоматично валідує та перетворює дані із запиту
 * Використовується в контролерах для обробки query-параметрів
 */
export class GetLogsDto {
  // Режим пагінації: 'cursor' (швидкий) або 'offset' (класичний)
  @IsOptional()
  @IsString()
  mode?: 'cursor' | 'offset' = 'cursor';

  // Кількість записів на сторінці (мінімум 1)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  // Рівень логування для фільтрації (INFO, WARN, ERROR, DEBUG) або 'ALL' для всіх
  @IsOptional()
  @IsString()
  level?: LogLevel | 'ALL' = 'ALL';

  // Назва сервісу для фільтрації або 'ALL' для всіх
  @IsOptional()
  @IsString()
  service?: string = 'ALL';

  // Пошуковий запит для пошуку в тексті повідомлення
  @IsOptional()
  @IsString()
  search?: string = '';

  // Початок тимчасового діапазону (формат ISO 8601)
  @IsOptional()
  @IsString()
  from?: string = '';

  // Кінець часового діапазону (формат ISO 8601)
  @IsOptional()
  @IsString()
  to?: string = '';

  // Номер сторінки для offset-пагінації (мінімум 1)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Ідентифікатор запису для cursor-пагинации (починати з цього запису)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;
}
