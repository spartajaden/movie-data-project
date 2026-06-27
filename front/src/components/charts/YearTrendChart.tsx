import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Movie } from "../../types/movie";

interface Props {
  movies: Movie[];
}

export function YearTrendChart({ movies }: Props) {
  const yearMap = new Map<number, { count: number; ratingSum: number }>();
  movies.forEach((m) => {
    const y = parseInt(m.release_date.slice(0, 4));
    if (!y) return;
    const prev = yearMap.get(y) || { count: 0, ratingSum: 0 };
    yearMap.set(y, {
      count: prev.count + 1,
      ratingSum: prev.ratingSum + m.vote_average,
    });
  });

  const data = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { count, ratingSum }]) => ({
      year,
      개봉작수: count,
      평균평점: parseFloat((ratingSum / count).toFixed(2)),
    }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        연도별 트렌드
      </h2>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{
              value: "개봉작 수",
              angle: -90,
              position: "insideLeft",
              fill: "#9ca3af",
              fontSize: 12,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[6, 10]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{
              value: "평균 평점",
              angle: 90,
              position: "insideRight",
              fill: "#9ca3af",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              color: "#f9fafb",
            }}
          />
          <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 13 }} />
          <Bar
            yAxisId="left"
            dataKey="개봉작수"
            fill="#60a5fa"
            radius={[3, 3, 0, 0]}
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="평균평점"
            stroke="#4ade80"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#4ade80" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
