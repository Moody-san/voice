import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'rawResponse';

/**
 * Marks a route handler as returning its body verbatim, bypassing the global
 * {data, error} envelope. Used by the Vapi endpoints, which must return the
 * provider-defined `{ results: [...] }` shape.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
