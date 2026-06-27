import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Movie } from "../../types/movie";

interface Props {
  movie: Movie;
  allMovies: Movie[];
}

export function RadarStatChart({ movie, allMovies }: Props) {
  const maxPop = Math.max(...allMovies.map((m) => m.popularity));
  const kobisMovies = allMovies.filter((m) => m.audi_acc != null);
  const maxAudi = kobisMovies.length
    ? Math.max(...kobisMovies.map((m) => m.audi_acc ?? 0))
    : 1;
  const hasKobis = movie.audi_acc != null;

  const data = [
    { subject: "평점", value: Math.round((movie.vote_average / 10) * 100) },
    { subject: "인기도", value: Math.round((movie.popularity / maxPop) * 100) },
    ...(hasKobis
      ? [
          {
            subject: "관객수",
            value: Math.round(((movie.audi_acc ?? 0) / maxAudi) * 100),
          },
        ]
      : []),
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-200 uppercase tracking-widest mb-4">
        종합 스탯
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
        >
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => [`${Number(v)}점`, "점수"]}
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#f9fafb",
              fontSize: 12,
            }}
          />
          <Radar
            dataKey="value"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.25}
            dot={{ r: 3, fill: "#22c55e" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
