import type { BoxOfficeEntry } from "../../types/movie";

interface Props {
  entries: BoxOfficeEntry[];
  date: string;
}

function fmt만(n: number) {
  return `${Math.round(n / 10000).toLocaleString()}만`;
}

function fmt억(n: number) {
  return `${(n / 1e8).toFixed(1)}억`;
}

export function BoxOfficeTable({ entries, date }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          일별 박스오피스
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-300">
          {date} 기준
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-200 text-xs">
              <th className="px-4 py-2.5 text-center font-medium w-10">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">영화명</th>
              <th className="px-4 py-2.5 text-right font-medium">개봉일</th>
              <th className="px-4 py-2.5 text-right font-medium">당일 관객</th>
              <th className="px-4 py-2.5 text-right font-medium">누적 관객</th>
              <th className="px-4 py-2.5 text-right font-medium">매출액</th>
              <th className="px-4 py-2.5 text-right font-medium">점유율</th>
              <th className="px-4 py-2.5 text-right font-medium">스크린</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((e) => (
              <tr
                key={e.rank}
                className="bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                      e.rank <= 3
                        ? "bg-green-500 text-white"
                        : "text-gray-500 dark:text-gray-200"
                    }`}
                  >
                    {e.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {e.movieNm}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-200">
                  {e.openDt}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                  {fmt만(e.audiCnt)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">
                  {fmt만(e.audiAcc)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                  {fmt억(e.salesAmt)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-200">
                  {e.salesShare.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-200">
                  {e.scrnCnt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
