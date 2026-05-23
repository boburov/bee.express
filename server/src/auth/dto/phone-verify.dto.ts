import { IsString, Length, MaxLength, MinLength } from 'class-validator';

export class PhoneVerifyDto {
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
