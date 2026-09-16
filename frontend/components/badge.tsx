import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "neutral" | "success" | "outline";
  className?: string;
};

/** Small mono status/label pill in the Modernist style. */
export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em]",
        variant === "neutral" && "bg-surface text-soft",
        variant === "outline" && "border border-line-2 text-soft",
        variant === "success" && "bg-success-soft text-success-text",
        className,
      )}
    >
      {children}
    </span>
  );
}
