package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KobisWeeklyResponse {
    private BoxOfficeResult boxOfficeResult;
    private FaultInfo faultInfo;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FaultInfo {
        private String errorCode;
        private String message;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BoxOfficeResult {
        private String showRange;
        private List<WeeklyItem> weeklyBoxOfficeList;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WeeklyItem {
        private String rank;
        private String movieCd;
        private String movieNm;
        private String openDt;
        private String salesAmt;
        private String salesShare;
        private String salesAcc;
        private String audiCnt;
        private String audiAcc;
        private String scrnCnt;
        private String showCnt;
    }
}
