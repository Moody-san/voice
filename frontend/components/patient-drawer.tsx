"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/badge";
import type { Patient } from "@/lib/api";
import { cn, formatDateTime, formatDob, formatPhone } from "@/lib/utils";

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          "text-[15px] text-text",
          mono && "font-mono text-[13px]",
          !value && "text-faint",
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule-soft py-6 first:border-t-0 first:pt-0">
      <h3 className="eyebrow mb-4 text-ink">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </section>
  );
}

export function PatientDrawer({
  patient,
  onClose,
}: {
  patient: Patient | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = !!patient;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/20 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Panel */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[440px] overflow-y-auto border-l border-line bg-card shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {patient && (
          <div className="p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <span className="eyebrow">Patient</span>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  {patient.first_name} {patient.last_name}
                </h2>
                <div className="mt-2">
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <Group title="Demographics">
              <Field label="First name" value={patient.first_name} />
              <Field label="Last name" value={patient.last_name} />
              <Field
                label="Date of birth"
                value={formatDob(patient.date_of_birth)}
                mono
              />
              <Field label="Sex" value={patient.sex} />
              <Field label="Preferred language" value={patient.preferred_language} />
            </Group>

            <Group title="Contact">
              <Field label="Phone" value={formatPhone(patient.phone_number)} mono />
              <Field label="Email" value={patient.email} />
            </Group>

            <Group title="Address">
              <Field label="Address line 1" value={patient.address_line_1} />
              <Field label="Address line 2" value={patient.address_line_2} />
              <Field label="City" value={patient.city} />
              <Field label="State" value={patient.state} mono />
              <Field label="ZIP" value={patient.zip_code} mono />
            </Group>

            <Group title="Insurance">
              <Field label="Provider" value={patient.insurance_provider} />
              <Field label="Member ID" value={patient.insurance_member_id} mono />
            </Group>

            <Group title="Emergency contact">
              <Field label="Name" value={patient.emergency_contact_name} />
              <Field
                label="Phone"
                value={formatPhone(patient.emergency_contact_phone)}
                mono
              />
            </Group>

            <Group title="Record">
              <Field label="Patient ID" value={patient.patient_id} mono />
              <Field label="Registered" value={formatDateTime(patient.created_at)} />
              <Field label="Updated" value={formatDateTime(patient.updated_at)} />
            </Group>
          </div>
        )}
      </div>
    </div>
  );
}
