"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/me", label: "Home" },
    { href: "/me/expenses/new", label: "Submit" },
    { href: "/me/expenses", label: "Expenses" },
    { href: "/me/card", label: "Card" }
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 justify-between rounded-full border border-white/60 bg-white/95 px-3 py-2 shadow-card backdrop-blur lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={cn("rounded-full px-4 py-2 text-sm font-medium", pathname === item.href ? "bg-ink text-white" : "text-slate")}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
