import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Login DTO — minimal validation. Username/password content rules belong on
 * the SuperAdmin *create* path, not here: enforcing min-length at the login
 * step turns a "wrong password" attempt into a 400 with a leaky error message
 * ("password must be longer than..."), instead of the uniform 401 the service
 * returns for any auth failure.
 */
export class SuperAdminLoginDto {
  @IsString()
  @MaxLength(64)
  username!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}
