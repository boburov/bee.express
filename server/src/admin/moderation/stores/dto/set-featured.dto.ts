import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class SetFeaturedDto {
  @IsBoolean()
  isFeatured!: boolean;

  /** Sort order on the home slider (lower = earlier). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  featuredRank?: number;
}
