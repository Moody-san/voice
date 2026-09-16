# Vapi Setup

How to wire the phone number to this backend. Everything here is done once in
the [Vapi dashboard](https://dashboard.vapi.ai); the JSON files are the
source-of-truth reference for what to enter.

## Prerequisites

- Backend running and reachable at your ngrok domain, e.g.
  `https://ivonne-noninterchangeable-vagariously.ngrok-free.dev`
  (verify: `curl https://<domain>/health` returns `{"data":{"status":"ok"...}}`).
- Your `VAPI_SECRET` value from `backend/.env`.
- An OpenAI API key added under Vapi **Provider Keys** (for gpt-4o).

## 1. Create the two tools

Dashboard → **Tools** → **Create Tool** → type **Function**. Create both tools
using the schemas in [`tools.json`](./tools.json):

- `lookupPatientByPhone`
- `savePatient`

For **each** tool:
- **Server URL**: `https://<your-ngrok-domain>/vapi/webhook`
- **Headers** → Add Header: `x-vapi-secret` = `<VAPI_SECRET>`
  (or create a Bearer credential with the `x-vapi-secret` header and attach it).

## 2. Create the assistant

Dashboard → **Assistants** → **Create**. Configure per [`assistant.json`](./assistant.json):
- **Model**: OpenAI **gpt-4o**, temperature ~0.4
- **System Prompt**: paste the full contents of [`system-prompt.md`](./system-prompt.md)
- **Tools**: attach `lookupPatientByPhone` and `savePatient`
- **First message**: the greeting from `assistant.json`
- **Transcriber**: Deepgram nova-2 (English) — or the dashboard default
- **Voice**: any (e.g. Vapi "Elliot")

## 3. Enable the transcript webhook (bonus)

Assistant → **Advanced / Server**:
- **Server URL**: `https://<your-ngrok-domain>/vapi/webhook`
- **Server Messages**: enable **end-of-call-report** (and **tool-calls** if not
  already delivered via the tool server URL)
- Add the same `x-vapi-secret` header/credential.

The backend stores each call's transcript + summary in the `calls` table.

## 4. Attach the phone number

Dashboard → **Phone Numbers** → your number → **Inbound** → set the assistant
to **Patient Intake - Sam**. Save.

## 5. Call it

Dial the number and register a patient. Then verify persistence:

```bash
curl https://<your-ngrok-domain>/patients
```

## Notes

- The backend dispatches all Vapi messages through the single `/vapi/webhook`
  endpoint and returns the provider-required `{ results: [...] }` shape for
  tool calls.
- If a tool call ever 401s, the `x-vapi-secret` header doesn't match
  `VAPI_SECRET` in `backend/.env`.
