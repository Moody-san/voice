import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { VapiService } from './vapi.service';
import { VapiSecretGuard } from '../../common/guards/vapi-secret.guard';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import {
  VapiEndOfCallReportPayload,
  VapiToolCallsPayload,
} from './vapi.types';

/**
 * Single webhook for Vapi. Configure this URL (with the x-vapi-secret header)
 * as both the tool server URL and the assistant server URL in the dashboard.
 * We switch on message.type:
 *   - "tool-calls"          -> run tools, return { results: [...] }
 *   - "end-of-call-report"  -> persist transcript, return ack
 *   - anything else         -> ack and ignore
 *
 * @RawResponse() keeps the provider-required response shapes (bypasses the
 * global { data, error } envelope). The handler never throws for tool calls,
 * so the agent always receives a usable result.
 */
@ApiExcludeController()
@UseGuards(VapiSecretGuard)
@Controller('vapi')
export class VapiController {
  private readonly logger = new Logger(VapiController.name);

  constructor(private readonly vapi: VapiService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @RawResponse()
  async webhook(@Body() body: any) {
    const type = body?.message?.type;

    if (type === 'tool-calls') {
      const payload = body as VapiToolCallsPayload;
      const results = await this.vapi.handleToolCalls(
        payload.message.toolCallList ?? [],
      );
      return { results };
    }

    if (type === 'end-of-call-report') {
      try {
        await this.vapi.saveCallReport(body as VapiEndOfCallReportPayload);
      } catch (err) {
        // Never fail the webhook over transcript storage — just log it.
        this.logger.error('Failed to store call report', err as Error);
      }
      return { received: true };
    }

    return { received: true };
  }
}
