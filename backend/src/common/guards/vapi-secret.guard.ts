import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guards the public /vapi/* endpoints. Vapi is configured to send a shared
 * secret as the `x-vapi-secret` header on every tool call and webhook; we
 * compare it (constant-time) against VAPI_SECRET. Without this, anyone who
 * discovered the ngrok URL could write patient records.
 */
@Injectable()
export class VapiSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-vapi-secret') ?? '';
    const expected = this.config.get<string>('vapiSecret') ?? '';

    if (!expected || !safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid Vapi secret');
    }
    return true;
  }
}

/** Length-checked constant-time-ish string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
