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
import type { Movie } from "../../types/movie";

interface Props {
  movies: Movie[];
}

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#38bdf8",
  "#fbbf24",
  "#f87171",
  "#818cf8",
  "#2dd4bf",
  "#c084fc",
  "#fb7185",
  "#4ade80",
  "#facc15",
];

export function GenreChart({ movies }: Props) {
  const [metric, setMetric] = useState<"count" | "rating">("count");

  const genreMap = new Map<string, { count: number; ratingSum: number }>();
  movies.forEach((m) => {
    (m.genres ?? []).forEach((g) => {
      const prev = genreMap.get(g) || { count: 0, ratingSum: 0 };
      genreMap.set(g, {
        count: prev.count + 1,
        ratingSum: prev.ratingSum + m.vote_average,
      });
    });
  });

  const data = Array.from(genreMap.entries())
    .map(([name, { count, ratingSum }]) => ({
      name,
      count,
      rating: parseFloat((ratingSum / count).toFixed(2)),
    }))
    .sort((a, b) =>
      metric === "count" ? b.count - a.count : b.rating - a.rating,
    );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-gray-500">
        <p className="text-sm">장르 데이터가 없습니다.</p>
        <p className="text-xs">영화 데이터를 새로 수집하면 장르 정보가 채워집니다.</p>
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
          POST /api/movies/refresh
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          장르별 분포
        </h2>
        <div className="flex gap-2">
          {(["count", "rating"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                metric === m
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
              }`}
            >
              {m === "count" ? "영화 수" : "평균 평점"}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              color: "#f9fafb",
            }}
            formatter={(v) =>
              metric === "count"
                ? [`${v}편`, "영화 수"]
                : [`★ ${v}`, "평균 평점"]
            }
          />
          <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
