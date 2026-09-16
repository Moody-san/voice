import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from '../../database/entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const patient = this.patients.create(dto);
    const saved = await this.patients.save(patient);
    // Observability: log the final persisted demographic payload.
    this.logger.log(
      `Patient created ${saved.patient_id}: ${JSON.stringify(saved)}`,
    );
    return saved;
  }

  /** Soft-deleted patients are excluded automatically by TypeORM. */
  async findAll(query: QueryPatientsDto): Promise<Patient[]> {
    const where: Record<string, unknown> = {};
    if (query.last_name) where.last_name = ILike(query.last_name);
    if (query.date_of_birth) where.date_of_birth = query.date_of_birth;
    if (query.phone_number) where.phone_number = query.phone_number;

    return this.patients.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patients.findOne({
      where: { patient_id: id },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return patient;
  }

  /**
   * Active (non-deleted) patient matching a normalized phone number, or null.
   * Backs the voice agent's duplicate detection.
   */
  async findActiveByPhone(phoneNumber: string): Promise<Patient | null> {
    return this.patients.findOne({ where: { phone_number: phoneNumber } });
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, dto);
    const saved = await this.patients.save(patient);
    this.logger.log(
      `Patient updated ${saved.patient_id}: ${JSON.stringify(saved)}`,
    );
    return saved;
  }

  /** Soft delete: sets deleted_at, never removes the row. Idempotent-ish. */
  async softDelete(id: string): Promise<void> {
    await this.findOne(id); // 404 if missing or already soft-deleted
    await this.patients.softDelete(id);
    this.logger.log(`Patient soft-deleted ${id}`);
  }
}
