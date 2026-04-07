import { cn } from "@/lib/utils";

export function SimpleTable({
  columns,
  rows,
  className
}: {
  columns: string[];
  rows: React.ReactNode[][];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[1.5rem] border border-mist", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-mist text-left text-sm">
          <thead className="bg-mist/50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium uppercase tracking-[0.2em] text-slate">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist bg-white/80">
            {rows.map((row, index) => (
              <tr key={index} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-ink">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
