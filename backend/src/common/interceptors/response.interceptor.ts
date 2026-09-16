import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

/**
 * Wraps every successful controller return value in the mandated envelope:
 *   { "data": <payload>, "error": null }
 *
 * Handlers marked @RawResponse() (the Vapi endpoints) are passed through
 * untouched so they can return the provider's own shape. Responses already
 * flushed by the handler (headersSent) are also left alone.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data: unknown) => {
        if (isRaw) return data;
        const res = context.switchToHttp().getResponse();
        if (res?.headersSent) return data;
        return { data: data ?? null, error: null };
      }),
    );
  }
}
