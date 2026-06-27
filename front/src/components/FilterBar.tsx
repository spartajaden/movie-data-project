import type { Movie, SortKey } from "../types/movie";

interface Props {
  movies: Movie[];
  yearRange: [number, number];
  selectedGenres: string[];
  sortKey: SortKey;
  topN: number;
  onYearRange: (r: [number, number]) => void;
  onGenres: (g: string[]) => void;
  onSort: (k: SortKey) => void;
  onTopN: (n: number) => void;
}

const inputCls =
  "px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50";

export function FilterBar({
  movies,
  yearRange,
  selectedGenres,
  sortKey,
  topN,
  onYearRange,
  onGenres,
  onSort,
  onTopN,
}: Props) {
  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genres))).sort();
  const allYears = movies
    .map((m) => parseInt(m.release_date.slice(0, 4)))
    .filter(Boolean);
  const minYear = allYears.length ? Math.min(...allYears) : 1990;
  const maxYear = allYears.length ? Math.max(...allYears) : 2024;

  const toggleGenre = (g: string) => {
    if (selectedGenres.includes(g)) {
      onGenres(selectedGenres.filter((x) => x !== g));
    } else {
      onGenres([...selectedGenres, g]);
    }
  };

  return (
    <div className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 space-y-5">
        {/* 컨트롤 행 */}
        <div className="flex flex-wrap items-end gap-4">
          {/* 연도 범위 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wide">
              연도 범위
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={minYear}
                max={yearRange[1]}
                value={yearRange[0]}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v))
                    onYearRange([Math.min(v, yearRange[1]), yearRange[1]]);
                }}
                className={`${inputCls} w-20 text-center`}
              />
              <span className="text-gray-300 dark:text-gray-600">—</span>
              <input
                type="number"
                min={yearRange[0]}
                max={maxYear}
                value={yearRange[1]}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v))
                    onYearRange([yearRange[0], Math.max(v, yearRange[0])]);
                }}
                className={`${inputCls} w-20 text-center`}
              />
            </div>
          </div>

          {/* 정렬 기준 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wide">
              정렬 기준
            </label>
            <select
              value={sortKey}
              onChange={(e) => onSort(e.target.value as SortKey)}
              className={`${inputCls} pr-8`}
            >
              <option value="vote_average">평점</option>
              <option value="popularity">인기도</option>
              <option value="release_date">최신순</option>
            </select>
          </div>

          {/* Top N */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wide">
              Top N
            </label>
            <input
              type="number"
              min={5}
              max={110}
              value={topN}
              onChange={(e) =>
                onTopN(
                  Math.max(5, Math.min(110, parseInt(e.target.value) || 20)),
                )
              }
              className={`${inputCls} w-20 text-center`}
            />
          </div>

          {/* 선택 초기화 */}
          {selectedGenres.length > 0 && (
            <button
              onClick={() => onGenres([])}
              className="self-end mb-0.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              장르 초기화 ✕
            </button>
          )}
        </div>

        {/* 장르 필터 */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wide">
            장르{" "}
            {selectedGenres.length > 0 && (
              <span className="text-green-500">
                ({selectedGenres.length}개 선택)
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedGenres.includes(g)
                    ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:border-green-400 dark:hover:border-green-500"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
