import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { normalizeUsPhone } from '../../../common/utils/phone.util';
import { parseDob } from '../../../common/utils/dob.util';

/**
 * Optional filters for GET /patients. `phone_number` and `date_of_birth` are
 * normalized to their stored canonical form so callers can pass either the
 * formatted or raw variant (e.g. "(415) 555-0132" or "01/02/1990").
 */
export class QueryPatientsDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  last_name?: string;

  @IsOptional()
  @Transform(({ value }) => parseDob(value) ?? value)
  @IsString()
  date_of_birth?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeUsPhone(value) ?? value)
  @IsString()
  phone_number?: string;
}
