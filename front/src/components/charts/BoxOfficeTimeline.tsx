import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BoxOfficeEntry } from "../../types/movie";

interface Props {
  entries: BoxOfficeEntry[];
}

export function BoxOfficeTimeline({ entries }: Props) {
  const data = [...entries]
    .sort((a, b) => b.audiCnt - a.audiCnt)
    .slice(0, 10)
    .map((e) => ({
      name: e.movieNm.length > 8 ? e.movieNm.slice(0, 7) + "…" : e.movieNm,
      당일관객: Math.round(e.audiCnt / 1000), // 천 명 단위
      점유율: e.salesShare,
    }));

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          당일 관객수 분포
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-200 mt-0.5">
          단위: 천 명
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} unit="천" />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              color: "#f9fafb",
            }}
            formatter={(v) => [
              `${Number(v).toLocaleString()}천 명`,
              "당일 관객수",
            ]}
          />
          <Bar dataKey="당일관객" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
