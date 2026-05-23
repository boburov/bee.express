import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class ReorderItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
