/**
 * Thin client for the patient REST API. The base URL points at the backend
 * (the ngrok domain in production, localhost in dev) via NEXT_PUBLIC_API_URL.
 * Every response uses the backend's { data, error } envelope.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export type Patient = {
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: "Male" | "Female" | "Other" | "Decline to Answer";
  phone_number: string;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider: string | null;
  insurance_member_id: string | null;
  preferred_language: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

type Envelope<T> = { data: T | null; error: { message: string } | null };

export type PatientFilters = {
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
};

export async function getPatients(
  filters: PatientFilters = {},
): Promise<Patient[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v && v.trim()) qs.set(k, v.trim());
  }
  const url = `${API_BASE}/patients${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    // Bypass ngrok's free-tier browser-warning interstitial, which would
    // otherwise return HTML instead of JSON to this client-side fetch.
    headers: { "ngrok-skip-browser-warning": "true" },
  });
  const body = (await res.json()) as Envelope<Patient[]>;
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data ?? [];
}
