"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

const colors = ["#10223c", "#c75c3d", "#6d8b65", "#8e7d5d", "#8898aa"];

export function CategoryChart({ data }: { data: Array<{ category: string; total: string; count: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="category" innerRadius={58} outerRadius={92}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
