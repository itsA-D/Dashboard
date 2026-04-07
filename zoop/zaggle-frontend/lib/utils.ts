import clsx from "clsx";
import { format } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value?: string | null, pattern = "dd MMM yyyy") {
  if (!value) {
    return "—";
  }

  return format(new Date(value), pattern);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
