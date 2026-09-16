import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sex } from '../../common/enums/sex.enum';

/**
 * Standard US patient demographic record.
 *
 * Notes on a few deliberate choices:
 * - `patient_id` is the public UUID identifier (spec requirement).
 * - `date_of_birth` is a `date` (no time/zone) — a birth date is a calendar
 *   day, not an instant.
 * - `phone_number` / `emergency_contact_phone` store the normalized 10-digit
 *   form; formatting is a presentation concern.
 * - Soft delete via `deleted_at` (@DeleteDateColumn): TypeORM automatically
 *   excludes soft-deleted rows from queries, so list + duplicate-lookup never
 *   surface deleted patients without any manual `WHERE` filter.
 */
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  patient_id: string;

  @Column({ type: 'varchar', length: 50 })
  first_name: string;

  @Column({ type: 'varchar', length: 50 })
  last_name: string;

  @Column({ type: 'date' })
  date_of_birth: string;

  @Column({ type: 'enum', enum: Sex })
  sex: Sex;

  // Indexed: duplicate detection looks patients up by phone on every call.
  @Index()
  @Column({ type: 'varchar', length: 10 })
  phone_number: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255 })
  address_line_1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line_2: string | null;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 2 })
  state: string;

  @Column({ type: 'varchar', length: 10 })
  zip_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_provider: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_member_id: string | null;

  @Column({ type: 'varchar', length: 50, default: 'English' })
  preferred_language: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergency_contact_name: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emergency_contact_phone: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
