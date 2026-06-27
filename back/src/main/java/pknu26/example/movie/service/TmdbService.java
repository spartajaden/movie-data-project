package pknu26.example.movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import pknu26.example.movie.dto.TmdbGenreListResponse;
import pknu26.example.movie.dto.TmdbMovieDetailResponse;
import pknu26.example.movie.dto.TmdbMovieItem;
import pknu26.example.movie.dto.TmdbMovieListResponse;
import pknu26.example.movie.entity.TmdbMovie;
import pknu26.example.movie.repository.TmdbMovieRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TmdbService {

    private static final String BASE = "https://api.themoviedb.org/3";

    @Value("${tmdb.api.key}")
    private String apiKey;

    private final TmdbMovieRepository movieRepository;
    private final RestTemplate restTemplate;

    public TmdbService(TmdbMovieRepository movieRepository) {
        this.movieRepository = movieRepository;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public int fetchAndStore() {
        log.info("TMDB 영화 데이터 수집 시작...");

        Map<Integer, String> genreMap = fetchGenreMap();
        log.info("장르 목록 로드 완료: {}개", genreMap.size());

        List<TmdbMovie> movies = new ArrayList<>();
        for (int page = 1; page <= 5; page++) {
            List<TmdbMovie> pageMovies = fetchTopRatedPage(page, genreMap);
            movies.addAll(pageMovies);
            log.info("페이지 {}/5 완료 (누적 {}편)", page, movies.size());
        }

        movieRepository.saveAll(movies);
        log.info("영화 {}편 저장 완료", movies.size());
        return movies.size();
    }

    private Map<Integer, String> fetchGenreMap() {
        String url = BASE + "/genre/movie/list?api_key=" + apiKey + "&language=ko-KR";
        TmdbGenreListResponse resp = restTemplate.getForObject(url, TmdbGenreListResponse.class);

        Map<Integer, String> map = new HashMap<>();
        if (resp != null && resp.getGenres() != null) {
            for (TmdbGenreListResponse.Genre g : resp.getGenres()) {
                map.put(g.getId(), g.getName());
            }
        }
        return map;
    }

    public TmdbMovie getMovieById(Long id) {
        return movieRepository.findById(id).orElseGet(() -> fetchMovieFromTmdb(id));
    }

    private TmdbMovie fetchMovieFromTmdb(Long id) {
        try {
            String url = BASE + "/movie/" + id + "?api_key=" + apiKey + "&language=ko-KR";
            TmdbMovieDetailResponse resp = restTemplate.getForObject(url, TmdbMovieDetailResponse.class);
            if (resp == null) return null;

            List<String> genreNames = resp.getGenres() == null ? List.of() :
                    resp.getGenres().stream()
                            .map(TmdbMovieDetailResponse.Genre::getName)
                            .collect(Collectors.toList());

            return TmdbMovie.builder()
                    .id(resp.getId())
                    .title(resp.getTitle())
                    .originalTitle(resp.getOriginalTitle())
                    .overview(resp.getOverview())
                    .releaseDate(resp.getReleaseDate())
                    .voteAverage(resp.getVoteAverage())
                    .voteCount(resp.getVoteCount())
                    .popularity(resp.getPopularity())
                    .posterPath(resp.getPosterPath())
                    .backdropPath(resp.getBackdropPath())
                    .genres(genreNames)
                    .build();
        } catch (Exception e) {
            log.warn("TMDB 영화 상세 조회 실패 (id={}): {}", id, e.getMessage());
            return null;
        }
    }

    public List<TmdbMovie> searchMovies(String query) {
        Map<Integer, String> genreMap = fetchGenreMap();
        String url = UriComponentsBuilder.fromHttpUrl(BASE + "/search/movie")
                .queryParam("api_key", apiKey)
                .queryParam("language", "ko-KR")
                .queryParam("query", query)
                .toUriString();
        TmdbMovieListResponse resp = restTemplate.getForObject(url, TmdbMovieListResponse.class);
        if (resp == null || resp.getResults() == null) return List.of();
        return resp.getResults().stream()
                .map(item -> toMovie(item, genreMap))
                .collect(Collectors.toList());
    }

    private List<TmdbMovie> fetchTopRatedPage(int page, Map<Integer, String> genreMap) {
        String url = BASE + "/movie/top_rated?api_key=" + apiKey + "&language=ko-KR&page=" + page;
        TmdbMovieListResponse resp = restTemplate.getForObject(url, TmdbMovieListResponse.class);

        if (resp == null || resp.getResults() == null) return List.of();

        return resp.getResults().stream()
                .map(item -> toMovie(item, genreMap))
                .collect(Collectors.toList());
    }

    private TmdbMovie toMovie(TmdbMovieItem item, Map<Integer, String> genreMap) {
        List<String> genreNames = item.getGenreIds() == null ? List.of() :
                item.getGenreIds().stream()
                        .map(id -> genreMap.getOrDefault(id, null))
                        .filter(name -> name != null)
                        .collect(Collectors.toList());

        return TmdbMovie.builder()
                .id(item.getId())
                .title(item.getTitle())
                .originalTitle(item.getOriginalTitle())
                .overview(item.getOverview())
                .releaseDate(item.getReleaseDate())
                .voteAverage(item.getVoteAverage())
                .voteCount(item.getVoteCount())
                .popularity(item.getPopularity())
                .posterPath(item.getPosterPath())
                .backdropPath(item.getBackdropPath())
                .genres(genreNames)
                .build();
    }
}
