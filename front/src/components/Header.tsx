import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDetailPage = location.pathname.startsWith("/movie/");
  const isGamePage = location.pathname === "/battle";

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {(isDetailPage || isGamePage) && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mr-1"
            >
              ← 대시보드
            </button>
          )}
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition-colors"
          >
            CineStats
          </Link>
          {!isDetailPage && !isGamePage && (
            <>
              <span className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-300">
                영화 데이터 대시보드
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
          aria-label="테마 전환"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
