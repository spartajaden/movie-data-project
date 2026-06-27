import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  useMovieTracking,
  useTrackableMovies,
} from "../../hooks/useMovieTracking";

const COLORS = ["#22c55e", "#16a34a", "#4ade80", "#86efac"];

const tooltipStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f9fafb",
  fontSize: 12,
};

function fmtNum(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return n.toLocaleString();
}

export function KoficTrackingTab() {
  const { movies, loading: moviesLoading } = useTrackableMovies();
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const { data, loading } = useMovieTracking(selected);

  const filtered = search
    ? movies
        .filter((m) => m.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 20)
    : movies.slice(0, 20);

  const weeklyData = data.reduce<
    Record<
      number,
      {
        week: number;
        audiCnt: number;
        audiAcc: number;
        salesAmt: number;
        avgAudiPerScreen: number;
        count: number;
      }
    >
  >((acc, d) => {
    const w = d.weekNumber;
    if (!acc[w])
      acc[w] = {
        week: w,
        audiCnt: 0,
        audiAcc: 0,
        salesAmt: 0,
        avgAudiPerScreen: 0,
        count: 0,
      };
    acc[w].audiCnt += d.audiCnt;
    acc[w].salesAmt += d.salesAmt;
    acc[w].avgAudiPerScreen += d.audiPerScreen;
    acc[w].count++;
    acc[w].audiAcc = Math.max(acc[w].audiAcc, d.audiAcc);
    return acc;
  }, {});

  const weeklyChartData = Object.values(weeklyData)
    .map((w) => ({
      ...w,
      label: `${w.week}주차`,
      avgAudiPerScreen: Math.round((w.avgAudiPerScreen / w.count) * 10) / 10,
    }))
    .sort((a, b) => a.week - b.week);

  return (
    <div className="space-y-8">
      {/* 영화 선택 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          영화 선택
        </h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="영화명 검색..."
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        {moviesLoading ? (
          <p className="text-gray-400 text-sm mt-3 animate-pulse">
            영화 목록 로딩 중...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {filtered.map((m) => (
              <button
                key={m}
                onClick={() => setSelected(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selected === m
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {m}
              </button>
            ))}
            {movies.length > 20 && !search && (
              <span className="px-3 py-1.5 text-xs text-gray-400">
                +{movies.length - 20}개 더...
              </span>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400 text-sm animate-pulse">
            추적 데이터 로딩 중...
          </p>
        </div>
      )}

      {!loading && selected && data.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          '{selected}'의 일별 박스오피스 데이터가 없습니다
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* 누적 관객 추이 (X: 개봉 주차) */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              누적 관객수 추이 — {selected}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              X축: 개봉 주차, Y축: 누적 관객수
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart
                data={weeklyChartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={fmtNum}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [fmtNum(Number(v)), "누적 관객"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="audiAcc"
                  name="누적 관객"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 주차별 관객수 (바 차트) */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              주차별 관객수
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              각 개봉 주차에 동원한 총 관객수
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weeklyChartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={fmtNum}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [fmtNum(Number(v)), "주간 관객"]}
                />
                <Bar dataKey="audiCnt" name="주간 관객" radius={[4, 4, 0, 0]}>
                  {weeklyChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 스크린당 관객수 추이 */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              스크린당 관객수 추이
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              주차별 평균 스크린당 관객수 변화
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={weeklyChartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${Number(v)}명`, "스크린당 관객"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgAudiPerScreen"
                  name="스크린당 관객"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 일별 상세 테이블 */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
              일별 상세 데이터
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-3 pr-4">날짜</th>
                    <th className="pb-3 pr-4 text-right">경과일</th>
                    <th className="pb-3 pr-4 text-right">주차</th>
                    <th className="pb-3 pr-4 text-right">당일 관객</th>
                    <th className="pb-3 pr-4 text-right">누적 관객</th>
                    <th className="pb-3 pr-4 text-right">스크린수</th>
                    <th className="pb-3 text-right">스크린당 관객</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr
                      key={d.date}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2.5 pr-4 font-mono text-gray-600 dark:text-gray-300 text-xs">
                        {d.date}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-500">
                        {d.daysSinceRelease}일
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-500">
                        {d.weekNumber}주
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-900 dark:text-white">
                        {d.audiCnt.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-green-600 dark:text-green-400">
                        {fmtNum(d.audiAcc)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-500">
                        {d.scrnCnt.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">
                        {d.audiPerScreen.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selected && !moviesLoading && (
        <div className="text-center py-16 text-gray-400 text-sm">
          위에서 영화를 선택하면 개봉 주차별 추이를 확인할 수 있습니다
        </div>
      )}
    </div>
  );
}
