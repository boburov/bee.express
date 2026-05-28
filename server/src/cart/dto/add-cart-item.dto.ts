import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  offerId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  qty!: number;
}
