import { IsBoolean } from 'class-validator';

export class ToggleOpenDto {
  @IsBoolean()
  isOpen!: boolean;
}
