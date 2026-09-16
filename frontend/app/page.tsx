"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";
import { Badge } from "@/components/badge";
import { PatientDrawer } from "@/components/patient-drawer";
import {
  API_BASE,
  getPatients,
  type Patient,
  type PatientFilters,
} from "@/lib/api";
import { formatDob, formatPhone } from "@/lib/utils";

const EMPTY: PatientFilters = { last_name: "", date_of_birth: "", phone_number: "" };

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filters, setFilters] = useState<PatientFilters>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);

  const load = useCallback(async (f: PatientFilters) => {
    setLoading(true);
    setError(null);
    try {
      setPatients(await getPatients(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patients");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced reload whenever filters change.
  useEffect(() => {
    const t = setTimeout(() => load(filters), 250);
    return () => clearTimeout(t);
  }, [filters, load]);

  const set = (key: keyof PatientFilters) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      {/* Header */}
      <header className="mb-10">
        <span className="eyebrow">Voice AI Intake</span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Patient Registry
          </h1>
          <button
            onClick={() => load(filters)}
            className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-card px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] text-soft transition-colors hover:border-ink hover:text-ink"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-soft">
          Patients registered by phone through the voice agent, persisted to
          Postgres and served over the REST API.
        </p>
        <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-faint">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          {API_BASE.replace(/^https?:\/\//, "")}
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterInput
          placeholder="Last name"
          value={filters.last_name ?? ""}
          onChange={set("last_name")}
        />
        <FilterInput
          placeholder="Date of birth (MM/DD/YYYY)"
          value={filters.date_of_birth ?? ""}
          onChange={set("date_of_birth")}
        />
        <FilterInput
          placeholder="Phone number"
          value={filters.phone_number ?? ""}
          onChange={set("phone_number")}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <div className="flex items-center justify-between border-b border-rule-soft px-5 py-3">
          <span className="eyebrow flex items-center gap-2">
            <Users size={13} /> Patients
          </span>
          <span className="font-mono text-[11px] text-faint">
            {loading ? "…" : `${patients.length} record${patients.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {error ? (
          <StateRow>
            <span className="text-danger-text">{error}</span>
            <span className="mt-1 block text-faint">
              Is the API reachable at {API_BASE}?
            </span>
          </StateRow>
        ) : loading ? (
          <StateRow>Loading…</StateRow>
        ) : patients.length === 0 ? (
          <StateRow>No patients match. Register one by calling the number.</StateRow>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule-soft">
                {["Name", "Date of birth", "Sex", "Phone", "Location"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.patient_id}
                  onClick={() => setSelected(p)}
                  className="cursor-pointer border-b border-rule-soft/60 transition-colors last:border-b-0 hover:bg-surface/60"
                >
                  <td className="px-5 py-3.5 font-medium text-ink">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-soft">
                    {formatDob(p.date_of_birth)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline">{p.sex}</Badge>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-soft">
                    {formatPhone(p.phone_number)}
                  </td>
                  <td className="px-5 py-3.5 text-soft">
                    {p.city}, {p.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PatientDrawer patient={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      />
      <input
        {...props}
        className="w-full rounded-md border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-faint focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
    </div>
  );
}

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-14 text-center text-sm text-muted">{children}</div>
  );
}
