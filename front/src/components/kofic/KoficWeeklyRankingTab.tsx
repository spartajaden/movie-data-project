import type { WeeklyEntry } from "../../types/movie";

interface Props {
  entries: WeeklyEntry[];
  periodLabel: string;
}

function RankBadge({ rank }: { rank: number }) {
  const base =
    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold";
  if (rank === 1)
    return <span className={`${base} bg-yellow-400 text-yellow-900`}>1</span>;
  if (rank === 2)
    return <span className={`${base} bg-gray-300 text-gray-700`}>2</span>;
  if (rank === 3)
    return <span className={`${base} bg-orange-400 text-orange-900`}>3</span>;
  return (
    <span className={`${base} bg-gray-100 dark:bg-gray-800 text-gray-500`}>
      {rank}
    </span>
  );
}

function fmtWon(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

function fmtAudi(n: number) {
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return n.toLocaleString();
}

export function KoficWeeklyRankingTab({
  entries,
  periodLabel,
}: Props) {
  if (entries.length === 0)
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );

  return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {[
                "순위",
                "영화명",
                "개봉일",
                `${periodLabel} 관객`,
                "누적 관객",
                `${periodLabel} 매출`,
                "점유율",
                "스크린",
                "상영횟수",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <RankBadge rank={e.rank} />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap max-w-[180px] truncate">
                  {e.movieNm}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {e.openDt}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white font-medium">
                  {fmtAudi(e.audiCnt)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-200">
                  {fmtAudi(e.audiAcc)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-200">
                  {fmtWon(e.salesAmt)}원
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block min-w-[52px] text-right font-semibold text-green-600 dark:text-green-400">
                    {e.salesShare.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                  {e.scrnCnt.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                  {e.showCnt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
