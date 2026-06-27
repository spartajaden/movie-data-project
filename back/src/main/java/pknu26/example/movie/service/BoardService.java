package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pknu26.example.movie.dto.GenreStatResponse;
import pknu26.example.movie.entity.TmdbMovie;
import pknu26.example.movie.repository.TmdbMovieRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final TmdbMovieRepository movieRepository;

    public List<TmdbMovie> getAllMovies() {
        return movieRepository.findAll();
    }

    public List<TmdbMovie> getFilteredMovies(String startYear, String endYear, String sortBy, int limit) {
        String sortProperty = "id";
        if ("평점".equals(sortBy) || "voteAverage".equals(sortBy)) sortProperty = "voteAverage";
        else if ("인기도".equals(sortBy) || "popularity".equals(sortBy)) sortProperty = "popularity";
        else if ("최신순".equals(sortBy) || "releaseDate".equals(sortBy)) sortProperty = "releaseDate";

        Sort sort = Sort.by(Sort.Direction.DESC, sortProperty);

        List<TmdbMovie> movies = movieRepository.findMoviesByYearRange(startYear, endYear, sort);

        if (movies.size() > limit) {
            return movies.subList(0, limit);
        }
        return movies;
    }

    public List<GenreStatResponse> getGenreStats() {
        return movieRepository.getGenreStatistics();
    }

    public TmdbMovie getMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 영화를 찾을 수 없습니다. id=" + id));
    }

    public List<TmdbMovie> searchMovies(String keyword) {
        return movieRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Transactional
    public void saveMovie(TmdbMovie movie) {
        movieRepository.save(movie);
    }

    @Transactional
    public void deleteMovie(Long id) {
        TmdbMovie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 영화가 존재하지 않습니다. id=" + id));
        movieRepository.delete(movie);
    }
}
