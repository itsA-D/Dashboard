export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const
  },
  dashboard: {
    analytics: ["dashboard", "analytics"] as const
  },
  users: {
    all: ["users"] as const
  },
  expenses: {
    all: ["expenses"] as const,
    list: (filters?: Record<string, string | undefined>) => ["expenses", "list", filters] as const,
    detail: (id: string) => ["expenses", "detail", id] as const
  },
  approvals: {
    queue: ["approvals", "queue"] as const
  },
  cards: {
    list: ["cards", "list"] as const,
    detail: (id: string) => ["cards", "detail", id] as const,
    transactions: (id: string) => ["cards", id, "transactions"] as const
  },
  budgets: {
    list: ["budgets", "list"] as const,
    utilisation: ["budgets", "utilisation"] as const
  },
  reports: {
    detail: (id: string | null) => ["reports", id] as const
  },
  notifications: {
    list: ["notifications"] as const
  },
  audit: {
    list: ["audit"] as const
  },
  settings: {
    company: ["settings", "company"] as const,
    companySettings: ["settings", "company-settings"] as const,
    expensePolicies: ["settings", "expense-policies"] as const
  }
};
