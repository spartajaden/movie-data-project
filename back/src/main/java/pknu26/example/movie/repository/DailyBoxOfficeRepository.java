package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pknu26.example.movie.entity.DailyBoxOffice;

import java.util.List;

public interface DailyBoxOfficeRepository extends JpaRepository<DailyBoxOffice, Long> {
    List<DailyBoxOffice> findByDateOrderByRankAsc(String date);
    boolean existsByDate(String date);

    @Modifying
    @Query("DELETE FROM DailyBoxOffice d WHERE d.date < :cutoffDate")  // 30일 초과 데이터 삭제 쿼리 추가
    int deleteByDateBefore(@Param("cutoffDate") String cutoffDate);

    @Query("SELECT DISTINCT d.date FROM DailyBoxOffice d ORDER BY d.date DESC")
    List<String> findDistinctDatesDesc();

    List<DailyBoxOffice> findByMovieNmOrderByDateAsc(String movieNm);

    @Query("SELECT DISTINCT d.movieNm FROM DailyBoxOffice d ORDER BY d.movieNm")
    List<String> findDistinctMovieNames();
}
