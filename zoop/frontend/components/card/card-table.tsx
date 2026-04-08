import Link from "next/link";
import { SimpleTable } from "@/components/common/simple-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Card } from "@/types";

export function CardTable({ cards }: { cards: Card[] }) {
  return (
    <SimpleTable
      columns={["Holder", "Card", "Status", "Monthly limit", "Balance", "Issued"]}
      rows={cards.map((card) => [
        <Link key={`${card.id}-user`} href={`/cards/${card.id}`} className="font-semibold underline-offset-4 hover:underline">
          {card.user_name}
        </Link>,
        `•••• ${card.last_four}`,
        card.status,
        formatCurrency(card.monthly_limit),
        formatCurrency(card.available_balance),
        formatDate(card.issued_at)
      ])}
    />
  );
}
