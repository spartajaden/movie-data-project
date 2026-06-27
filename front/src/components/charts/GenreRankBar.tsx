import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Movie } from "../../types/movie";

interface Props {
  movie: Movie;
  allMovies: Movie[];
}

export function GenreRankBar({ movie, allMovies }: Props) {
  const primaryGenre = movie.genres[0];
  const peers = allMovies
    .filter((m) => m.id !== movie.id && m.genres.includes(primaryGenre))
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 9);

  const data = [
    { title: movie.title, value: movie.vote_average, isCurrent: true },
    ...peers.map((m) => ({
      title: m.title,
      value: m.vote_average,
      isCurrent: false,
    })),
  ].sort((a, b) => b.value - a.value);

  const truncate = (s: string, n = 14) =>
    s.length > n ? s.slice(0, n) + "…" : s;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-200 uppercase tracking-widest mb-4">
        {primaryGenre} 장르 내 평점 순위
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(220, data.length * 36)}
      >
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
        >
          <XAxis
            type="number"
            domain={[6, 10]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="title"
            width={120}
            tick={({ x, y, payload }) => (
              <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                fill={
                  data.find((d) => d.title === payload.value)?.isCurrent
                    ? "#22c55e"
                    : "#9ca3af"
                }
                fontSize={11}
                fontWeight={
                  data.find((d) => d.title === payload.value)?.isCurrent
                    ? 700
                    : 400
                }
              >
                {truncate(payload.value)}
              </text>
            )}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`★ ${Number(v).toFixed(1)}`, "평점"]}
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#f9fafb",
              fontSize: 12,
            }}
          />
          <ReferenceLine
            x={movie.vote_average}
            stroke="#22c55e"
            strokeDasharray="3 3"
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.isCurrent ? "#22c55e" : "#374151"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
