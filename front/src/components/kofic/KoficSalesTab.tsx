import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { BoxOfficeEntry } from "../../types/movie";
import type { AiCommentaryPayload } from "../../api/ai";
import { ChartAiWrapper } from "../ChartAiWrapper";

interface Props {
  entries: BoxOfficeEntry[];
  aiPayload?: AiCommentaryPayload | null;
}

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

function fmtWon(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

export function KoficSalesTab({ entries, aiPayload }: Props) {
  if (entries.length === 0)
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );

  const shareData = entries.map((e, i) => ({
    name: e.movieNm.length > 10 ? e.movieNm.slice(0, 9) + "…" : e.movieNm,
    value: parseFloat(e.salesShare.toFixed(1)),
    fill: COLORS[i % COLORS.length],
  }));

  const salesAmtData = [...entries]
    .sort((a, b) => b.salesAmt - a.salesAmt)
    .map((e) => ({
      name: e.movieNm.length > 12 ? e.movieNm.slice(0, 11) + "…" : e.movieNm,
      value: Math.round(e.salesAmt / 1e4),
    }))
    .reverse();

  const salesAccData = [...entries]
    .sort((a, b) => b.salesAcc - a.salesAcc)
    .map((e) => ({
      name: e.movieNm.length > 12 ? e.movieNm.slice(0, 11) + "…" : e.movieNm,
      value: Math.round(e.salesAcc / 1e8),
    }))
    .reverse();

  const tooltipStyle = {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 8,
    color: "#f9fafb",
    fontSize: 12,
  };

  return (
    <div className="space-y-12">
      {/* 매출 점유율 파이 */}
      <ChartAiWrapper payload={aiPayload ?? null} chartFocus="sales">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            매출 점유율
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={shareData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, value }) => `${name} ${value}%`}
                labelLine={false}
              >
                {shareData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${Number(v)}%`, "점유율"]}
              />
              <Legend
                formatter={(v) => (
                  <span className="text-xs text-gray-400">{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>

      {/* 당일 매출액 */}
      <ChartAiWrapper payload={aiPayload ?? null} chartFocus="sales">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            당일 매출액 (만원)
          </h3>
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, entries.length * 28)}
          >
            <BarChart
              data={salesAmtData}
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
                tickFormatter={(v) => `${(v / 1e4).toFixed(0)}억`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${fmtWon(Number(v) * 1e4)}원`, "매출액"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {salesAmtData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>

      {/* 누적 매출액 */}
      <ChartAiWrapper payload={aiPayload ?? null} chartFocus="sales">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            누적 매출액 (억원)
          </h3>
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, entries.length * 28)}
          >
            <BarChart
              data={salesAccData}
              layout="vertical"
              margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
                horizontal={false}
              />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${Number(v)}억원`, "누적 매출"]}
              />
              <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>
    </div>
  );
}
