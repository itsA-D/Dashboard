import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.coerce.number().positive().max(500000),
  expense_date: z.string().min(1),
  merchant_name: z.string().min(2).max(100),
  category: z.enum(["travel", "meals", "fuel", "accommodation", "medical", "telecom", "other"]),
  description: z.string().max(500).optional(),
  receipt_key: z.string().optional(),
  merchant_mcc: z.string().optional(),
  card: z.string().optional().nullable()
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
