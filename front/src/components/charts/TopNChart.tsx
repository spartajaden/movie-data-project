import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Movie, SortKey } from "../../types/movie";

interface Props {
  movies: Movie[];
  topN: number;
  sortKey: SortKey;
}

const METRIC_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "vote_average", label: "평점" },
  { key: "popularity", label: "인기도" },
];

const GRADIENT = ["#4ade80", "#34d399", "#22c55e", "#16a34a", "#15803d"];

export function TopNChart({ movies, topN, sortKey }: Props) {
  const [metric, setMetric] = useState<SortKey>(sortKey);

  const getValue = (m: Movie) => {
    if (metric === "vote_average") return m.vote_average;
    return m.popularity;
  };

  const data = [...movies]
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, topN)
    .map((m) => ({
      name: m.title.length > 22 ? m.title.slice(0, 20) + "…" : m.title,
      value: parseFloat(getValue(m).toFixed(1)),
    }))
    .reverse();

  const unit = "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top {topN} 영화
        </h2>
        <div className="flex gap-2">
          {METRIC_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setMetric(o.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                metric === o.key
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, topN * 28)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            opacity={0.3}
            horizontal={false}
          />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              color: "#f9fafb",
            }}
            formatter={(v) => [
              `${v}${unit}`,
              METRIC_OPTIONS.find((o) => o.key === metric)?.label ?? "",
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={GRADIENT[i % GRADIENT.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
