"use client";

import { useParams } from "next/navigation";
import { CardTransactions } from "@/components/card/card-transactions";
import { CardWidget } from "@/components/card/card-widget";
import { DataPanel } from "@/components/common/data-panel";
import { PageShell } from "@/components/common/page-shell";
import { useCard, useCardAction, useCardTransactions } from "@/hooks/use-cards";
import { formatCurrency } from "@/lib/utils";

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const cardQuery = useCard(params.id);
  const transactionsQuery = useCardTransactions(params.id);
  const actionMutation = useCardAction();

  if (!cardQuery.data) {
    return <div className="text-sm text-slate">Loading card...</div>;
  }

  return (
    <PageShell eyebrow="Card detail" title={cardQuery.data.user_name} description={`Card ending in ${cardQuery.data.last_four}`}>
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <CardWidget card={cardQuery.data} />
          <DataPanel title="Card controls" subtitle={`Monthly limit ${formatCurrency(cardQuery.data.monthly_limit)}`}>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => actionMutation.mutate({ id: cardQuery.data!.id, action: "freeze" })}>
                Freeze
              </button>
              <button className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white" onClick={() => actionMutation.mutate({ id: cardQuery.data!.id, action: "unfreeze" })}>
                Unfreeze
              </button>
              <button className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white" onClick={() => actionMutation.mutate({ id: cardQuery.data!.id, action: "block" })}>
                Block
              </button>
            </div>
          </DataPanel>
        </div>
        <DataPanel title="Transactions" subtitle="Recent network activity for this card">
          <CardTransactions transactions={transactionsQuery.data ?? []} />
        </DataPanel>
      </div>
    </PageShell>
  );
}
