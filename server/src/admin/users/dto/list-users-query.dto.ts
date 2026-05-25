import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query params for GET /api/admin/users.
 * - `roleSlug`: filter to one role (customer|seller|courier|admin or any dynamic slug).
 *               Special token "_none" returns users with no role assigned.
 * - `isBlocked`: "true" | "false".
 * - `q`: free-text — matches firstName, lastName, telegramUsername, or phone digits.
 * - `page` / `pageSize`: 1-based pagination, capped at 100.
 */
export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  roleSlug?: string;

  @IsOptional()
  @IsBooleanString()
  isBlocked?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
