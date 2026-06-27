import { getYesterday } from "./koficDate";

interface Props {
  date: string;
  onChange: (date: string) => void;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DATA_MIN_DATE = "2004-01-01";

export function KoficDateNav({ date, onChange }: Props) {
  const yesterday = getYesterday();
  const isLatest = date >= yesterday;
  const isEarliest = date <= DATA_MIN_DATE;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">
          조회일
        </span>

        <button
          onClick={() => onChange(addDays(date, -1))}
          disabled={isEarliest}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isEarliest
              ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
              : "text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          ← 이전
        </button>

        <input
          type="date"
          value={date}
          min={DATA_MIN_DATE}
          max={yesterday}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer"
        />

        <button
          onClick={() => onChange(addDays(date, 1))}
          disabled={isLatest}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isLatest
              ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
              : "text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          다음 →
        </button>

        {!isLatest && (
          <button
            onClick={() => onChange(yesterday)}
            className="ml-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
          >
            최신
          </button>
        )}
      </div>
    </div>
  );
}
