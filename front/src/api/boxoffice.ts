import type { BoxOfficeEntry, WeeklyEntry } from "../types/movie";

export async function fetchBoxOffice(date?: string): Promise<BoxOfficeEntry[]> {
  const params = date ? `?date=${date}` : "";
  const res = await fetch(`/api/boxoffice${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchWeeklyRanges(weekGb: "0" | "1"): Promise<string[]> {
  const res = await fetch(`/api/boxoffice/weekly/ranges?weekGb=${weekGb}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchWeeklyBoxOffice(
  range: string,
  weekGb: "0" | "1",
): Promise<WeeklyEntry[]> {
  const res = await fetch(
    `/api/boxoffice/weekly?range=${encodeURIComponent(range)}&weekGb=${weekGb}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
}
