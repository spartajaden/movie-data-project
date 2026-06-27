import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TrendAnalysis } from "../../types/movie";
import { ChartAiWrapper } from "../ChartAiWrapper";

interface Props {
  data: TrendAnalysis;
}

const SEASON_COLORS: Record<string, string> = {
  봄: "#4ade80",
  여름: "#f97316",
  가을: "#eab308",
  겨울: "#60a5fa",
};

function fmtWon(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조`;
  if (n >= 1e8) return `${(n / 1e8).toFixed(0)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

function fmtAudi(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

function getSeasonColor(period: string) {
  for (const [key, color] of Object.entries(SEASON_COLORS)) {
    if (period.includes(key)) return color;
  }
  return "#22c55e";
}

const tooltipStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f9fafb",
  fontSize: 12,
};

export function KoficTrendTab({ data }: Props) {
  const { monthly, seasonal } = data;

  if (monthly.length === 0 && seasonal.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        트렌드 데이터가 없습니다
      </div>
    );
  }

  const monthlyPayload =
    monthly.length > 0
      ? { type: "trend" as const, monthly: monthly as object[], seasonal: [] }
      : null;
  const seasonalPayload =
    seasonal.length > 0
      ? { type: "trend" as const, monthly: [], seasonal: seasonal as object[] }
      : null;

  const monthlyChart = monthly.map((m) => ({
    name: m.period.substring(2),
    sales: Math.round(m.totalSales / 1e8),
    audience: Math.round(m.totalAudience / 1e4),
    movies: m.movieCount,
    topMovie: m.topMovie,
    rawSales: m.totalSales,
    rawAudi: m.totalAudience,
  }));

  const seasonalChart = seasonal.map((s) => ({
    name: s.period,
    sales: Math.round(s.totalSales / 1e8),
    audience: Math.round(s.totalAudience / 1e4),
    movies: s.movieCount,
    topMovie: s.topMovie,
    screens: s.avgScreens,
    rawSales: s.totalSales,
    rawAudi: s.totalAudience,
    color: getSeasonColor(s.period),
  }));

  return (
    <div className="space-y-14">
      {/* 월별 매출 추이 */}
      <ChartAiWrapper payload={monthlyPayload}>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            월별 매출 추이
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            주간 박스오피스 기준 월별 총 매출액 (억원)
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={monthlyChart}
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => `${v}억`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => {
                  if (name === "sales")
                    return [`${fmtWon(Number(v) * 1e8)}원`, "매출액"];
                  return [v, name];
                }}
                labelFormatter={(label) => {
                  const item = monthlyChart.find((m) => m.name === label);
                  return item ? `${label} · 1위: ${item.topMovie}` : label;
                }}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {monthlyChart.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "#22c55e" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>

      {/* 월별 관객수 추이 */}
      <ChartAiWrapper payload={monthlyPayload}>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            월별 관객수 추이
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            주간 박스오피스 기준 월별 총 관객수 (만명)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyChart}
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => `${v}만`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${fmtAudi(Number(v) * 1e4)}명`, "관객수"]}
              />
              <Line
                type="monotone"
                dataKey="audience"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#22c55e" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>

      {/* 계절별 비교 */}
      {seasonalChart.length > 0 && (
        <ChartAiWrapper payload={seasonalPayload}>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              계절별 매출 비교
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                style={{ background: "#4ade80" }}
              />
              봄(3-5월)
              <span
                className="inline-block w-2.5 h-2.5 rounded-full ml-3 mr-1"
                style={{ background: "#f97316" }}
              />
              여름(6-8월)
              <span
                className="inline-block w-2.5 h-2.5 rounded-full ml-3 mr-1"
                style={{ background: "#eab308" }}
              />
              가을(9-11월)
              <span
                className="inline-block w-2.5 h-2.5 rounded-full ml-3 mr-1"
                style={{ background: "#60a5fa" }}
              />
              겨울(12-2월)
            </p>
            <ResponsiveContainer
              width="100%"
              height={Math.max(280, seasonalChart.length * 48)}
            >
              <BarChart
                data={seasonalChart}
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
                  tickFormatter={(v) => `${v}억`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${fmtWon(Number(v) * 1e8)}원`, "매출액"]}
                  labelFormatter={(label) => {
                    const item = seasonalChart.find((s) => s.name === label);
                    return item ? `${label} · 1위: ${item.topMovie}` : label;
                  }}
                />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                  {seasonalChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartAiWrapper>
      )}

      {/* 계절별 관객수 비교 */}
      {seasonalChart.length > 0 && (
        <ChartAiWrapper payload={seasonalPayload}>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              계절별 관객수 비교
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              주간 박스오피스 기준 계절별 총 관객수 (만명)
            </p>
            <ResponsiveContainer
              width="100%"
              height={Math.max(280, seasonalChart.length * 48)}
            >
              <BarChart
                data={seasonalChart}
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
                  tickFormatter={(v) => `${v}만`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${fmtAudi(Number(v) * 1e4)}명`, "관객수"]}
                />
                <Bar dataKey="audience" radius={[0, 4, 4, 0]}>
                  {seasonalChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartAiWrapper>
      )}

      {/* 계절별 요약 테이블 */}
      {seasonal.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            계절별 요약
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 text-left font-medium">시즌</th>
                  <th className="px-4 py-3 text-right font-medium">총 매출</th>
                  <th className="px-4 py-3 text-right font-medium">총 관객</th>
                  <th className="px-4 py-3 text-right font-medium">영화 수</th>
                  <th className="px-4 py-3 text-right font-medium">
                    평균 스크린
                  </th>
                  <th className="px-4 py-3 text-left font-medium">1위 영화</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {seasonal.map((s) => (
                  <tr
                    key={s.period}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ background: getSeasonColor(s.period) }}
                      />
                      {s.period}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {fmtWon(s.totalSales)}원
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {fmtAudi(s.totalAudience)}명
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {s.movieCount}편
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {s.avgScreens.toLocaleString()}개
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {s.topMovie}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
