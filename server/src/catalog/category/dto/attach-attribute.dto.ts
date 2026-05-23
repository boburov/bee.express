import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AttachAttributeDto {
  @IsString()
  attributeId!: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
