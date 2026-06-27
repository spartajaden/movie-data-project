package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WeeklyTrendDto {
    private String period;
    private long totalSales;
    private long totalAudience;
    private int movieCount;
    private String topMovie;
    private long avgScreens;
}
