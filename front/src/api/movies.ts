import type { Movie } from "../types/movie";

export async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`/api/movies`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchMovieById(id: number): Promise<Movie | null> {
  const res = await fetch(`/api/movies/${id}`);
  if (!res.ok) return null;
  return res.json();
}
