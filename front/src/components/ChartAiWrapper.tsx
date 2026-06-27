import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOnDemandAi } from "../hooks/useOnDemandAi";
import type { AiCommentaryPayload, ChartFocus } from "../api/ai";

interface Props {
  payload: AiCommentaryPayload | null;
  chartFocus?: ChartFocus;
  children: React.ReactNode;
}

export function ChartAiWrapper({ payload, chartFocus, children }: Props) {
  const enrichedPayload = useMemo<AiCommentaryPayload | null>(() => {
    if (!payload || !chartFocus) return payload;
    if (payload.type === "trend") return payload;
    return { ...payload, chartFocus };
  }, [payload, chartFocus]);
  const { open, commentary, loading, trigger, close } =
    useOnDemandAi(enrichedPayload);

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 min-w-0">
        {children}
        <div className="mt-6 flex justify-center">
          <button
            onClick={trigger}
            disabled={!payload || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>✦</span>
            {loading ? "AI 분석 중..." : "AI 분석 요청"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="w-72 flex-shrink-0"
          >
            <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/30 px-5 py-4 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">
                    ✦ AI 분석
                  </span>
                  <span className="text-xs text-green-500/60 dark:text-green-600/60">
                    Qwen3.5 4B
                  </span>
                </div>
                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm leading-none"
                >
                  ✕
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 inline-block"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-green-600/70 dark:text-green-500/70">
                    분석 중...
                  </span>
                </div>
              ) : commentary ? (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                >
                  {commentary}
                </motion.p>
              ) : (
                <p className="text-sm text-gray-400">
                  분석 결과를 가져오지 못했습니다.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
