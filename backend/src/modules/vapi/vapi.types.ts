/**
 * Minimal typings for the Vapi payloads we consume. Vapi sends far more than
 * this; we type only what we read.
 * Docs: https://docs.vapi.ai/tools/custom-tools and /server-url/events
 */

export interface VapiToolCall {
  id: string; // echoed back as toolCallId
  type?: string; // "function"
  // Real Vapi payloads nest name/arguments under `function` (OpenAI shape),
  // and `arguments` can be a JSON string. Older/flat shapes put them at the
  // top level. Both are handled in VapiService.normalizeToolCall.
  function?: {
    name: string;
    arguments: Record<string, unknown> | string;
  };
  name?: string;
  arguments?: Record<string, unknown> | string;
}

export interface VapiToolCallsPayload {
  message: {
    type: 'tool-calls';
    toolCallList: VapiToolCall[];
  };
}

export interface VapiToolResult {
  toolCallId: string;
  result: unknown; // string | object; Vapi feeds this back to the LLM
}

export interface VapiEndOfCallReportPayload {
  message: {
    type: 'end-of-call-report';
    endedReason?: string;
    call?: { id?: string };
    artifact?: {
      transcript?: string;
      summary?: string;
      recording?: { url?: string; stereoUrl?: string };
      messages?: unknown[];
    };
    // Some report shapes surface summary at the top level too.
    summary?: string;
  };
}
