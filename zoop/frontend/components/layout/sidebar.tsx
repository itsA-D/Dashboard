"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ title, navigation }: { title: string; navigation: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-white/50 bg-ink px-6 py-8 text-white lg:block">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Zoop</p>
        <h2 className="mt-3 font-display text-3xl">{title}</h2>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-full px-4 py-3 text-sm font-medium transition",
              pathname === item.href ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
