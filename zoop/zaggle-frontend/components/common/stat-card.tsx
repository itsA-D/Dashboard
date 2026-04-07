import { cn, formatCurrency } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "ink",
  currency = false
}: {
  label: string;
  value: string | number;
  tone?: "ink" | "ember" | "moss";
  currency?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/60 bg-white/90 p-6 shadow-card",
        tone === "ember" && "bg-gradient-to-br from-white to-orange-50",
        tone === "moss" && "bg-gradient-to-br from-white to-green-50"
      )}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-ink">{currency ? formatCurrency(value) : value}</p>
    </div>
  );
}
