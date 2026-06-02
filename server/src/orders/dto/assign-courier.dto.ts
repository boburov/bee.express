import { IsNotEmpty, IsString } from 'class-validator';

/** Seller assigns a READY order to one of their contracted couriers. */
export class AssignCourierDto {
  @IsString()
  @IsNotEmpty()
  courierId!: string;
}
