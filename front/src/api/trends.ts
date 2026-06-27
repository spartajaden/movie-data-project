import type { TrendAnalysis } from '../types/movie'

export async function fetchWeeklyTrends(): Promise<TrendAnalysis> {
  const res = await fetch(`/api/boxoffice/weekly/trends`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
