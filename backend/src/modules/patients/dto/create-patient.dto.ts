import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Sex } from '../../../common/enums/sex.enum';
import { US_STATES } from '../../../common/constants/us-states';
import { IsUsPhone } from '../../../common/validators/is-us-phone.validator';
import { IsValidDob } from '../../../common/validators/is-valid-dob.validator';
import { normalizeUsPhone } from '../../../common/utils/phone.util';
import { parseDob } from '../../../common/utils/dob.util';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Letters, spaces, hyphens and apostrophes (e.g. "Mary-Jane", "O'Brien").
const NAME_REGEX = /^[A-Za-z][A-Za-z' -]*$/;

/**
 * Server-side validation for a new patient. This is the authoritative gate —
 * the voice agent validates conversationally for UX, but the API never trusts
 * it. Phone and DOB are normalized to canonical storage form via @Transform;
 * if normalization fails the raw value is kept so the validator reports a
 * specific, field-level error.
 */
export class CreatePatientDto {
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  @Matches(NAME_REGEX, {
    message: 'first_name may contain only letters, spaces, hyphens, apostrophes',
  })
  first_name: string;

  @Transform(trim)
  @IsString()
  @Length(1, 50)
  @Matches(NAME_REGEX, {
    message: 'last_name may contain only letters, spaces, hyphens, apostrophes',
  })
  last_name: string;

  @Transform(({ value }) => parseDob(value) ?? value)
  @IsValidDob()
  date_of_birth: string;

  @IsEnum(Sex, {
    message: 'sex must be one of: Male, Female, Other, Decline to Answer',
  })
  sex: Sex;

  @Transform(({ value }) => normalizeUsPhone(value) ?? value)
  @IsUsPhone()
  phone_number: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @Transform(trim)
  @IsString()
  @Length(1, 255)
  address_line_1: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 255)
  address_line_2?: string;

  @Transform(trim)
  @IsString()
  @Length(1, 100)
  city: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(US_STATES, { message: 'state must be a valid 2-letter US abbreviation' })
  state: string;

  @Transform(trim)
  @Matches(/^\d{5}(-\d{4})?$/, {
    message: 'zip_code must be a 5-digit or ZIP+4 US postal code',
  })
  zip_code: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  insurance_provider?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'insurance_member_id must be alphanumeric',
  })
  @Length(1, 100)
  insurance_member_id?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  preferred_language?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  emergency_contact_name?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeUsPhone(value) ?? value)
  @IsUsPhone()
  emergency_contact_phone?: string;
}
