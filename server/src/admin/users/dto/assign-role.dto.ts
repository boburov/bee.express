import { IsOptional, IsString } from 'class-validator';

/**
 * Set or clear a user's role. `roleId: null` clears the assignment (e.g. to demote
 * an admin staff member back to a plain user before re-promoting).
 */
export class AssignRoleDto {
  @IsOptional()
  @IsString()
  roleId?: string | null;
}
