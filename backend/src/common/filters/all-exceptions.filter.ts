import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Turns any thrown error into the mandated error envelope:
 *   { "data": null, "error": { statusCode, message, details? } }
 *
 * Covers:
 * - HttpException (incl. ValidationPipe 422 — its message array becomes
 *   `error.details` so the caller/agent can re-prompt the specific field),
 * - TypeORM QueryFailedError (unique violation -> 409, otherwise 500),
 * - anything else -> 500.
 *
 * Every error is logged to stdout for observability.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        const rawMessage = b.message;
        if (Array.isArray(rawMessage)) {
          // ValidationPipe: array of per-field messages.
          message = 'Validation failed';
          details = rawMessage;
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      const driverCode = (exception as any).code;
      if (driverCode === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error';
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    this.logger.error(
      `${request.method} ${request.originalUrl} -> ${statusCode} ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(statusCode).json({
      data: null,
      error: { statusCode, message, ...(details ? { details } : {}) },
    });
  }
}
