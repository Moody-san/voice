import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A record of a Vapi phone call, populated from the end-of-call-report webhook.
 *
 * Kept separate from `patients` on purpose: a call arrives asynchronously
 * after the conversation ends, and the caller may have hung up before any
 * patient was saved — so `patient_id` is nullable and there is no hard FK
 * constraint (the report can reference a patient that was never created).
 */
@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128, nullable: true })
  vapi_call_id: string | null;

  // Soft link to the patient created/updated during this call, when known.
  @Index()
  @Column({ type: 'uuid', nullable: true })
  patient_id: string | null;

  @Column({ type: 'text', nullable: true })
  transcript: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ended_reason: string | null;

  @Column({ type: 'text', nullable: true })
  recording_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
