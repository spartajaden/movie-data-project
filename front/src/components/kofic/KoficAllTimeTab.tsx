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
import { useAllTimeRankings } from "../../hooks/useAllTimeRankings";

const COLORS = [
  "#22c55e",
  "#16a34a",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
  "#dcfce7",
  "#f0fdf4",
  "#6ee7b7",
  "#34d399",
  "#10b981",
];

const tooltipStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f9fafb",
  fontSize: 12,
};

function fmtNum(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

function fmtWon(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억원`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

function truncate(s: string, max = 12) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatOpenDt(dt: string) {
  if (!dt) return "-";
  if (dt.length === 8)
    return `${dt.slice(0, 4)}.${dt.slice(4, 6)}.${dt.slice(6, 8)}`;
  return dt;
}

export function KoficAllTimeTab() {
  const [sortBy, setSortBy] = useState<"audience" | "sales">("audience");
  const { data, loading } = useAllTimeRankings(sortBy);

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm animate-pulse">
          역대 순위 로딩 중...
        </p>
      </div>
    );

  if (data.length === 0)
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );

  const chartData = [...data]
    .map((e) => ({
      name: truncate(e.movieNm),
      value: sortBy === "audience" ? e.maxAudiAcc : e.maxSalesAcc,
      rank: e.rank,
    }))
    .reverse();

  return (
    <div className="space-y-10">
      {/* 정렬 기준 토글 */}
      <div className="flex items-center gap-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          역대 흥행 순위
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy("audience")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              sortBy === "audience"
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            관객수 기준
          </button>
          <button
            onClick={() => setSortBy("sales")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              sortBy === "sales"
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            매출액 기준
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-6">
        DB에 수집된 기간 내 누적 최대값 기준
      </p>

      {/* 바 차트 */}
      <ResponsiveContainer
        width="100%"
        height={Math.max(400, data.length * 32)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
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
            tickFormatter={(v) =>
              sortBy === "audience" ? fmtNum(v) : fmtWon(v)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [
              sortBy === "audience"
                ? `${Number(v).toLocaleString()}명`
                : fmtWon(Number(v)),
              sortBy === "audience" ? "누적 관객" : "누적 매출",
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 상세 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-3 pr-4 w-16">순위</th>
              <th className="pb-3 pr-4">영화명</th>
              <th className="pb-3 pr-4 text-right">개봉일</th>
              <th className="pb-3 pr-4 text-right">누적 관객수</th>
              <th className="pb-3 text-right">누적 매출액</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr
                key={e.rank}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      e.rank <= 3
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {e.rank}
                  </span>
                </td>
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                  {e.movieNm}
                </td>
                <td className="py-3 pr-4 text-right text-gray-500 text-xs">
                  {formatOpenDt(e.openDt)}
                </td>
                <td
                  className={`py-3 pr-4 text-right font-medium ${sortBy === "audience" ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {fmtNum(e.maxAudiAcc)}명
                </td>
                <td
                  className={`py-3 text-right font-medium ${sortBy === "sales" ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {fmtWon(e.maxSalesAcc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
