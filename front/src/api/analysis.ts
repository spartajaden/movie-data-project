import type {
  DerivedStats,
  MovieTracking,
  AllTimeRanking,
} from "../types/movie";

export async function fetchDerivedStats(
  date?: string,
): Promise<DerivedStats[]> {
  const params = date ? `?date=${date}` : "";
  const res = await fetch(`/api/boxoffice/derived${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchMovieTracking(
  movieNm: string,
): Promise<MovieTracking[]> {
  const res = await fetch(
    `/api/boxoffice/tracking?movieNm=${encodeURIComponent(movieNm)}`,
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchTrackableMovies(): Promise<string[]> {
  const res = await fetch(`/api/boxoffice/tracking/movies`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchAllTimeRankings(
  sortBy: "audience" | "sales" = "audience",
  limit = 20,
): Promise<AllTimeRanking[]> {
  const res = await fetch(
    `/api/boxoffice/alltime?sortBy=${sortBy}&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
