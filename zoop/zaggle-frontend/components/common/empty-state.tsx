import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-mist bg-white/60 px-6 py-12 text-center">
      <Inbox className="mb-4 h-10 w-10 text-slate" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate">{description}</p>
    </div>
  );
}
