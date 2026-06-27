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
} from "recharts";
import type { DerivedStats } from "../../types/movie";

interface Props {
  data: DerivedStats[];
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

const tooltipStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f9fafb",
  fontSize: 12,
};

function truncate(s: string, max = 12) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function KoficStatsTab({ data }: Props) {
  if (data.length === 0)
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );

  const audiPerScreenData = [...data]
    .sort((a, b) => b.audiPerScreen - a.audiPerScreen)
    .map((e) => ({
      name: truncate(e.movieNm),
      value: e.audiPerScreen,
      days: e.daysSinceRelease,
    }));

  const audiPerShowData = [...data]
    .sort((a, b) => b.audiPerShow - a.audiPerShow)
    .map((e) => ({ name: truncate(e.movieNm), value: e.audiPerShow }));

  const screenShareData = data
    .filter((e) => e.screenShare > 0)
    .map((e) => ({ name: truncate(e.movieNm, 10), value: e.screenShare }));

  const tableData = [...data].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-12">
      {/* 스크린당 관객수 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          스크린당 관객수
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          당일 관객수 / 스크린수 — 스크린 효율 지표
        </p>
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, data.length * 28)}
        >
          <BarChart
            data={audiPerScreenData}
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
              formatter={(v) => [`${Number(v).toFixed(1)}명`, "스크린당 관객"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {audiPerScreenData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 상영회차당 관객수 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          상영회차당 관객수
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          당일 관객수 / 상영횟수 — 회차별 집객력
        </p>
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, data.length * 28)}
        >
          <BarChart
            data={audiPerShowData}
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
              formatter={(v) => [`${Number(v).toFixed(1)}명`, "회차당 관객"]}
            />
            <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 스크린 점유율 파이 차트 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          스크린 점유율
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          전체 스크린 중 해당 영화의 스크린 비율
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={screenShareData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={140}
              label={({ name, value }) => `${name} ${value}%`}
              labelLine={{ stroke: "#6b7280" }}
            >
              {screenShareData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [`${Number(v)}%`, "점유율"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 파생 변수 테이블 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          파생 변수 종합
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="pb-3 pr-4">순위</th>
                <th className="pb-3 pr-4">영화명</th>
                <th className="pb-3 pr-4 text-right">경과일</th>
                <th className="pb-3 pr-4 text-right">스크린당 관객</th>
                <th className="pb-3 pr-4 text-right">회차당 관객</th>
                <th className="pb-3 pr-4 text-right">스크린 점유율</th>
                <th className="pb-3 text-right">매출 점유율</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((e) => (
                <tr
                  key={e.rank}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4 font-mono text-gray-400">
                    {e.rank}
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                    {truncate(e.movieNm, 16)}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600 dark:text-gray-300">
                    {e.daysSinceRelease}일
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-green-600 dark:text-green-400">
                    {e.audiPerScreen.toFixed(1)}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600 dark:text-gray-300">
                    {e.audiPerShow.toFixed(1)}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600 dark:text-gray-300">
                    {e.screenShare}%
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-300">
                    {e.salesShare}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
