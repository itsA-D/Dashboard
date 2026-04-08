import { formatCurrency } from "@/lib/utils";
import type { Card } from "@/types";

export function CardWidget({ card }: { card: Card }) {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-ink via-slate-800 to-ink p-6 text-white shadow-card">
      <p className="text-xs uppercase tracking-[0.35em] text-white/60">{card.network}</p>
      <div className="mt-10">
        <p className="text-2xl font-semibold">•••• •••• •••• {card.last_four}</p>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Available</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(card.available_balance)}</p>
          </div>
          <p className="rounded-full bg-white/10 px-3 py-1 text-sm capitalize">{card.status}</p>
        </div>
      </div>
    </div>
  );
}
