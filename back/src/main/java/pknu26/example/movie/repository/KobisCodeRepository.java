package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pknu26.example.movie.entity.KobisCode;

import java.util.List;

public interface KobisCodeRepository extends JpaRepository<KobisCode, Long> {
    List<KobisCode> findByComCode(String comCode);
    boolean existsByComCode(String comCode);
}
