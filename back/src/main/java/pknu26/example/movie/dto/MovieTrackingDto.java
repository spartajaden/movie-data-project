package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovieTrackingDto {
    private String date;
    private int daysSinceRelease;
    private int weekNumber;
    private long audiCnt;
    private long audiAcc;
    private long salesAmt;
    private long salesAcc;
    private long scrnCnt;
    private long showCnt;
    private double audiPerScreen;
    private double audiPerShow;
}
