import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatientsService } from '../patients/patients.service';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { UpdatePatientDto } from '../patients/dto/update-patient.dto';
import { Call } from '../../database/entities/call.entity';
import { normalizeUsPhone } from '../../common/utils/phone.util';
import {
  VapiEndOfCallReportPayload,
  VapiToolCall,
  VapiToolResult,
} from './vapi.types';

/** Tool names — must match the tool configuration in the Vapi dashboard. */
const TOOL_LOOKUP = 'lookupPatientByPhone';
const TOOL_SAVE = 'savePatient';

@Injectable()
export class VapiService {
  private readonly logger = new Logger(VapiService.name);

  constructor(
    private readonly patients: PatientsService,
    @InjectRepository(Call)
    private readonly calls: Repository<Call>,
  ) {}

  /**
   * Handle a batch of tool calls from Vapi and return one result per call id.
   * Never throws: every tool result (including failures) is returned to the
   * agent as structured data so it can speak a graceful message and re-prompt.
   */
  async handleToolCalls(toolCalls: VapiToolCall[]): Promise<VapiToolResult[]> {
    const results: VapiToolResult[] = [];
    for (const call of toolCalls) {
      const { id, name, args } = this.normalizeToolCall(call);
      this.logger.log(`Tool call ${name} (${id}): ${JSON.stringify(args)}`);
      try {
        results.push({
          toolCallId: id,
          result: await this.dispatch(name, args),
        });
      } catch (err) {
        this.logger.error(`Tool ${name} failed`, err as Error);
        results.push({
          toolCallId: id,
          result: {
            success: false,
            message:
              'A system error occurred while saving. Please try again in a moment.',
          },
        });
      }
    }
    return results;
  }

  /**
   * Vapi's tool-call items follow the OpenAI shape: name/arguments live under
   * `function`, and `arguments` may arrive as a JSON string. Older/flat shapes
   * put them at the top level. Normalize both into { id, name, args }.
   */
  private normalizeToolCall(call: VapiToolCall): {
    id: string;
    name: string;
    args: Record<string, unknown>;
  } {
    const name = call.function?.name ?? call.name ?? 'unknown';
    let raw: unknown = call.function?.arguments ?? call.arguments ?? {};
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = {};
      }
    }
    const args =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    return { id: call.id, name, args };
  }

  private async dispatch(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    switch (name) {
      case TOOL_LOOKUP:
        return this.lookupPatientByPhone(args);
      case TOOL_SAVE:
        return this.savePatient(args);
      default:
        return { success: false, message: `Unknown tool: ${name}` };
    }
  }

  /** Duplicate detection: find an existing patient by phone number. */
  private async lookupPatientByPhone(args: Record<string, unknown>) {
    const normalized = normalizeUsPhone(args.phone_number);
    if (!normalized) {
      return {
        found: false,
        message: 'That phone number is not a valid US number.',
      };
    }
    const patient = await this.patients.findActiveByPhone(normalized);
    if (!patient) return { found: false };
    return {
      found: true,
      patient: {
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone_number: patient.phone_number,
      },
    };
  }

  /**
   * Create or update a patient. `mode` is decided by the agent (based on the
   * earlier lookup): "create" for a new patient, "update" for a returning one
   * (with patient_id). Validation reuses the exact REST DTO rules; failures
   * come back as a list the agent can read out and re-prompt for.
   */
  private async savePatient(args: Record<string, unknown>) {
    const mode = args.mode === 'update' ? 'update' : 'create';
    const patientId = typeof args.patient_id === 'string' ? args.patient_id : null;
    // `mode`/`patient_id` are control fields, not patient columns.
    const { mode: _m, patient_id: _p, ...fields } = args;

    if (mode === 'update') {
      if (!patientId) {
        return {
          success: false,
          errors: ['patient_id is required to update an existing patient'],
        };
      }
      const dto = plainToInstance(UpdatePatientDto, fields, {
        enableImplicitConversion: false,
      });
      const errors = await this.collectErrors(dto);
      if (errors.length) return { success: false, errors };
      try {
        const saved = await this.patients.update(patientId, dto);
        return { success: true, mode, patient_id: saved.patient_id };
      } catch (err) {
        // The patient_id came from an earlier lookup but no longer exists
        // (e.g. deleted between calls). Tell the agent to create instead.
        if (err instanceof NotFoundException) {
          return {
            success: false,
            errors: [
              'That existing record could no longer be found — please register as a new patient (mode: create).',
            ],
          };
        }
        throw err;
      }
    }

    const dto = plainToInstance(CreatePatientDto, fields, {
      enableImplicitConversion: false,
    });
    const errors = await this.collectErrors(dto);
    if (errors.length) return { success: false, errors };
    const saved = await this.patients.create(dto);
    return { success: true, mode, patient_id: saved.patient_id };
  }

  /** Run class-validator and flatten to a list of human-readable messages. */
  private async collectErrors(dto: object): Promise<string[]> {
    const validationErrors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    return validationErrors.flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
  }

  /** Persist the end-of-call transcript/summary, linked to a patient if known. */
  async saveCallReport(payload: VapiEndOfCallReportPayload): Promise<void> {
    const msg = payload.message ?? ({} as VapiEndOfCallReportPayload['message']);
    const artifact = msg.artifact ?? {};
    const vapiCallId = msg.call?.id ?? null;

    const call = this.calls.create({
      vapi_call_id: vapiCallId,
      patient_id: null,
      transcript: artifact.transcript ?? null,
      summary: artifact.summary ?? msg.summary ?? null,
      ended_reason: msg.endedReason ?? null,
      recording_url: artifact.recording?.stereoUrl ?? artifact.recording?.url ?? null,
    });
    await this.calls.save(call);
    this.logger.log(
      `Stored call report ${vapiCallId ?? '(no id)'} — ended: ${msg.endedReason ?? 'unknown'}`,
    );
  }
}
