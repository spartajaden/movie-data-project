import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import type { Movie } from "../../types/movie";

interface Props {
  movies: Movie[];
}

interface TooltipPayload {
  payload: { title: string; x: number; y: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white shadow-lg">
      <p className="font-semibold truncate max-w-[180px]">{d.title}</p>
      <p className="text-gray-300">평점: ★ {d.x}</p>
      <p className="text-gray-300">인기도: {d.y.toFixed(1)}</p>
    </div>
  );
}

export function RatingScatter({ movies }: Props) {
  const data = movies.map((m) => ({
    x: m.vote_average,
    y: m.popularity,
    title: m.title,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          평점 vs 인기도
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-200 mt-0.5">
          X축: 평점(0~10) · Y축: TMDB 인기도 점수
        </p>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="x"
            type="number"
            name="평점"
            domain={[5, 10]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{
              value: "평점",
              position: "insideBottom",
              offset: -5,
              fill: "#9ca3af",
              fontSize: 12,
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="인기도"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{
              value: "인기도",
              angle: -90,
              position: "insideLeft",
              fill: "#9ca3af",
              fontSize: 12,
            }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#4ade80" opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
