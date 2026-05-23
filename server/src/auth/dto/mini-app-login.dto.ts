import { IsString, MaxLength, MinLength } from 'class-validator';

export class MiniAppLoginDto {
  @IsString()
  @MinLength(10)
  @MaxLength(4096)
  initData!: string;
}
