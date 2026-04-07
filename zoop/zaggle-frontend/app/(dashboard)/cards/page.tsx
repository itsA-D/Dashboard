"use client";

import { CardTable } from "@/components/card/card-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { useCards } from "@/hooks/use-cards";

export default function CardsPage() {
  const cardsQuery = useCards();

  return (
    <PageShell eyebrow="Card control" title="Issued cards" description="Monitor company cards, drill into balances, and manage freeze or block actions.">
      {!cardsQuery.data?.length ? (
        <EmptyState title="No cards issued" description="Issue cards from the finance flow once employees are onboarded." />
      ) : (
        <CardTable cards={cardsQuery.data} />
      )}
    </PageShell>
  );
}
