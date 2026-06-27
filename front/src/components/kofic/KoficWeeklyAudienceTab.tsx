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
import type { WeeklyEntry } from "../../types/movie";
import type { AiCommentaryPayload } from "../../api/ai";
import { ChartAiWrapper } from "../ChartAiWrapper";

interface Props {
  entries: WeeklyEntry[];
  periodLabel: string;
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

function fmtAudi(n: number) {
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return n.toLocaleString();
}

export function KoficWeeklyAudienceTab({
  entries,
  periodLabel,
  aiPayload,
}: Props) {
  if (entries.length === 0)
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );

  const audiCntData = [...entries]
    .sort((a, b) => b.audiCnt - a.audiCnt)
    .map((e) => ({
      name: e.movieNm.length > 12 ? e.movieNm.slice(0, 11) + "…" : e.movieNm,
      value: e.audiCnt,
    }))
    .reverse();

  const audiAccData = [...entries]
    .sort((a, b) => b.audiAcc - a.audiAcc)
    .map((e) => ({
      name: e.movieNm.length > 12 ? e.movieNm.slice(0, 11) + "…" : e.movieNm,
      value: Math.round(e.audiAcc / 1e4),
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
      <ChartAiWrapper payload={aiPayload ?? null} chartFocus="audience">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            {periodLabel} 관객수
          </h3>
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, entries.length * 28)}
          >
            <BarChart
              data={audiCntData}
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
                tickFormatter={(v) => fmtAudi(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${Number(v).toLocaleString()}명`, "관객수"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {audiCntData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>

      <ChartAiWrapper payload={aiPayload ?? null} chartFocus="audience">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            누적 관객수 (만명)
          </h3>
          <ResponsiveContainer
            width="100%"
            height={Math.max(280, entries.length * 28)}
          >
            <BarChart
              data={audiAccData}
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
                formatter={(v) => [`${Number(v)}만명`, "누적 관객"]}
              />
              <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartAiWrapper>
    </div>
  );
}
