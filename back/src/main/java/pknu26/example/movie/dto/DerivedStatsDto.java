package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DerivedStatsDto {
    private int rank;
    private String movieNm;
    private String openDt;
    private int daysSinceRelease;
    private long audiCnt;
    private long scrnCnt;
    private long showCnt;
    private double audiPerScreen;
    private double audiPerShow;
    private double screenShare;
    private double salesShare;
}
