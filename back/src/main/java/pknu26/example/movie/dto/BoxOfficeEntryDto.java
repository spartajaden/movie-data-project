package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoxOfficeEntryDto {
    private int rank;
    private int rankInten;        // 전일 대비 순위 증감 (양수=상승, 음수=하락)
    private String rankOldAndNew; // "OLD" or "NEW"
    private String movieNm;
    private String openDt;
    private long salesAmt;        // 당일 매출액
    private double salesShare;    // 매출 비율 (%)
    private long salesInten;      // 전일 대비 매출 증감
    private double salesChange;   // 전일 대비 매출 증감비율 (%)
    private long salesAcc;        // 누적 매출액
    private long audiCnt;         // 당일 관객수
    private long audiInten;       // 전일 대비 관객수 증감
    private double audiChange;    // 전일 대비 관객수 증감비율 (%)
    private long audiAcc;         // 누적 관객수
    private long scrnCnt;         // 스크린수
    private long showCnt;         // 상영횟수
    private String date;
}
