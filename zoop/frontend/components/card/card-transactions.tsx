import { SimpleTable } from "@/components/common/simple-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CardTransaction } from "@/types";

export function CardTransactions({ transactions }: { transactions: CardTransaction[] }) {
  return (
    <SimpleTable
      columns={["Merchant", "Type", "Amount", "When", "Description"]}
      rows={transactions.map((transaction) => [
        transaction.merchant_name || "—",
        transaction.transaction_type,
        formatCurrency(transaction.amount),
        formatDate(transaction.transaction_at, "dd MMM yyyy, p"),
        transaction.description || "—"
      ])}
    />
  );
}
