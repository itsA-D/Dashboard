"use client";

import { CardTransactions } from "@/components/card/card-transactions";
import { CardWidget } from "@/components/card/card-widget";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { useCards, useCardTransactions } from "@/hooks/use-cards";

export default function MyCardPage() {
  const { user } = useAuth();
  const cardsQuery = useCards();
  const card = (cardsQuery.data ?? []).find((item) => item.user === user?.id);
  const transactionsQuery = useCardTransactions(card?.id ?? "");

  return (
    <PageShell eyebrow="Card" title="My company card" description="View your current balance and the most recent transactions linked to your corporate spend card.">
      {!card ? (
        <EmptyState title="No card assigned" description="Finance has not issued a card to this account yet." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <CardWidget card={card} />
          <CardTransactions transactions={transactionsQuery.data ?? []} />
        </div>
      )}
    </PageShell>
  );
}
