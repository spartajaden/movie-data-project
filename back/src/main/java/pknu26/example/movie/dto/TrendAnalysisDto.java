package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TrendAnalysisDto {
    private List<WeeklyTrendDto> monthly;
    private List<WeeklyTrendDto> seasonal;
}
