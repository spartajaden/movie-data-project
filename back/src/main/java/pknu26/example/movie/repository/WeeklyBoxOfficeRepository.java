package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pknu26.example.movie.entity.WeeklyBoxOffice;

import java.util.List;

public interface WeeklyBoxOfficeRepository extends JpaRepository<WeeklyBoxOffice, Long> {
    List<WeeklyBoxOffice> findByShowRangeAndWeekGbOrderByRankAsc(String showRange, String weekGb);
    boolean existsByShowRangeAndWeekGb(String showRange, String weekGb);

    @Query("SELECT DISTINCT w.showRange FROM WeeklyBoxOffice w WHERE w.weekGb = :weekGb ORDER BY w.showRange DESC")
    List<String> findDistinctShowRangesByWeekGb(@Param("weekGb") String weekGb);
}
