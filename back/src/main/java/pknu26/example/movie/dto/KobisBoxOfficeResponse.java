package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KobisBoxOfficeResponse {
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
        private List<DailyItem> dailyBoxOfficeList;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DailyItem {
        private String rank;
        private String rankInten;
        private String rankOldAndNew;
        private String movieNm;
        private String openDt;
        private String salesAmt;
        private String salesShare;
        private String salesInten;
        private String salesChange;
        private String salesAcc;
        private String audiCnt;
        private String audiInten;
        private String audiChange;
        private String audiAcc;
        private String scrnCnt;
        private String showCnt;
    }
}
