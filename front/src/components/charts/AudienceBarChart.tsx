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
import type { Movie } from "../../types/movie";

interface Props {
  movies: Movie[];
  topN: number;
}

const COLORS = [
  "#4ade80",
  "#34d399",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#4ade80",
  "#34d399",
  "#22c55e",
  "#16a34a",
];

export function AudienceBarChart({ movies, topN }: Props) {
  const data = movies
    .filter((m) => m.audi_acc != null)
    .sort((a, b) => (b.audi_acc ?? 0) - (a.audi_acc ?? 0))
    .slice(0, topN)
    .map((m) => ({
      name: m.title.length > 10 ? m.title.slice(0, 9) + "…" : m.title,
      관객수: Math.round((m.audi_acc ?? 0) / 10000), // 만 명 단위
    }))
    .reverse();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-300 text-sm">
        KOBIS 관객수 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          누적 관객수 Top {data.length}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-200 mt-0.5">
          단위: 만 명 (한국 극장 기준)
        </p>
      </div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(250, data.length * 32)}
      >
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
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            unit="만"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
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
              `${Number(v).toLocaleString()}만 명`,
              "누적 관객수",
            ]}
          />
          <Bar dataKey="관객수" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
