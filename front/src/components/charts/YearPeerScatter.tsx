import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import type { Movie } from "../../types/movie";

interface Props {
  movie: Movie;
  allMovies: Movie[];
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { isCurrent: boolean };
}

function CustomDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload) return null;
  return payload.isCurrent ? (
    <circle
      cx={cx}
      cy={cy}
      r={8}
      fill="#22c55e"
      stroke="#fff"
      strokeWidth={2}
    />
  ) : (
    <circle cx={cx} cy={cy} r={4} fill="#374151" fillOpacity={0.7} />
  );
}

export function YearPeerScatter({ movie, allMovies }: Props) {
  const year = movie.release_date.slice(0, 4);

  const peers = allMovies
    .filter((m) => m.release_date.startsWith(year))
    .map((m) => ({
      x: m.popularity,
      y: m.vote_average,
      title: m.title,
      isCurrent: m.id === movie.id,
    }));

  if (peers.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-200 uppercase tracking-widest mb-1">
        {year}년 개봉작 비교
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-600 mb-4">
        인기도(X) vs 평점(Y) —{" "}
        <span className="text-green-500 font-semibold">●</span> 현재 영화
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <XAxis
            dataKey="x"
            name="인기도"
            type="number"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
            label={{
              value: "인기도",
              position: "insideBottom",
              offset: -10,
              fill: "#6b7280",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="y"
            name="평점"
            domain={[5, 10]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
            label={{
              value: "평점",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#6b7280",
              fontSize: 11,
            }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "#374151" }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
                  <p className="font-semibold mb-1">{d.title}</p>
                  <p>인기도: {d.x.toFixed(1)}</p>
                  <p>평점: ★ {d.y.toFixed(1)}</p>
                </div>
              );
            }}
          />
          <Scatter data={peers} shape={<CustomDot />}>
            {peers.map((_, i) => (
              <Cell key={i} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
