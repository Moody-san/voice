import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

/**
 * All fields optional for partial updates (PUT /patients/:id). Reuses the
 * exact validation/normalization rules from CreatePatientDto — any field that
 * is present is validated identically.
 */
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
