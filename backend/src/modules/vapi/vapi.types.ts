/**
 * Minimal typings for the Vapi payloads we consume. Vapi sends far more than
 * this; we type only what we read.
 * Docs: https://docs.vapi.ai/tools/custom-tools and /server-url/events
 */

export interface VapiToolCall {
  id: string; // echoed back as toolCallId
  name: string; // e.g. "savePatient"
  arguments: Record<string, unknown>;
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
