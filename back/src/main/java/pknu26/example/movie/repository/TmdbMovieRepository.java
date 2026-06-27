package pknu26.example.movie.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pknu26.example.movie.dto.GenreStatResponse;
import pknu26.example.movie.entity.TmdbMovie;

import java.util.List;

public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Long> {

    List<TmdbMovie> findByTitleContainingIgnoreCase(String keyword);

    @Query("SELECT m FROM TmdbMovie m WHERE SUBSTRING(m.releaseDate, 1, 4) BETWEEN :startYear AND :endYear")
    List<TmdbMovie> findMoviesByYearRange(@Param("startYear") String startYear, @Param("endYear") String endYear, Sort sort);

    @Query("SELECT new pknu26.example.movie.dto.GenreStatResponse(g, COUNT(m), ROUND(AVG(m.voteAverage), 2)) " +
           "FROM TmdbMovie m JOIN m.genres g " +
           "GROUP BY g " +
           "ORDER BY COUNT(m) DESC")
    List<GenreStatResponse> getGenreStatistics();
}
