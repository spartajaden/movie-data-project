package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pknu26.example.movie.entity.KobisMovie;

import java.util.List;

public interface KobisMovieRepository extends JpaRepository<KobisMovie, String> {
    List<KobisMovie> findByMovieNmContaining(String keyword);
}
