import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

/**
 * `scope` buckets a courier's own orders:
 *   - active  → COURIER_ASSIGNED + ON_WAY (work in progress)
 *   - history → DELIVERED (completed runs)
 *   - (omitted) → every order this courier has ever touched
 */
export class CourierOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['active', 'history'])
  scope?: 'active' | 'history';
}
