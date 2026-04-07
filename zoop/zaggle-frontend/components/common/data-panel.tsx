import { cn } from "@/lib/utils";

export function DataPanel({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[1.75rem] border border-white/60 bg-white/85 p-6 shadow-card", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="text-sm text-slate">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
