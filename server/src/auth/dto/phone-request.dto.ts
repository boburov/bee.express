import { IsString, MaxLength, MinLength } from 'class-validator';

export class PhoneRequestDto {
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone!: string;
}
