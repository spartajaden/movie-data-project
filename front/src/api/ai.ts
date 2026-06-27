export type ChartFocus = "ranking" | "sales" | "audience";

export type AiCommentaryPayload =
  | { type: "daily"; date: string; entries: object[]; chartFocus?: ChartFocus }
  | {
      type: "weekly" | "weekend";
      showRange: string;
      entries: object[];
      chartFocus?: ChartFocus;
    }
  | { type: "trend"; monthly: object[]; seasonal: object[] };

export async function fetchCommentary(
  payload: AiCommentaryPayload,
): Promise<string> {
  const res = await fetch(`/api/ai/commentary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("AI 분석 실패");
  const data = await res.json();
  return data.text as string;
}
