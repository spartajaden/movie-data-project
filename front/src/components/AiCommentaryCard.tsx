import { motion, AnimatePresence } from "motion/react";

interface Props {
  commentary: string | null;
  loading: boolean;
}

export function AiCommentaryCard({ commentary, loading }: Props) {
  if (!loading && !commentary) return null;

  return (
    <div className="mb-8 rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/30 px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 dark:text-green-400 text-sm font-bold">
          ✦ AI 분석
        </span>
        <span className="text-xs text-green-500/60 dark:text-green-600/60">
          Qwen3.5 4B
        </span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 inline-block"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </span>
            <span className="text-xs text-green-600/70 dark:text-green-500/70">
              분석 중...
            </span>
          </motion.div>
        ) : (
          <motion.p
            key="text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
          >
            {commentary}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
