import { cn } from "@/lib/utils";

export function PageShell({
  title,
  eyebrow,
  description,
  actions,
  children,
  className
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-card backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">{eyebrow}</p> : null}
            <div className="space-y-2">
              <h1 className="font-display text-4xl leading-none text-ink">{title}</h1>
              {description ? <p className="max-w-3xl text-sm text-slate">{description}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
