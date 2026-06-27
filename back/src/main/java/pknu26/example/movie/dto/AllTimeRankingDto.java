package pknu26.example.movie.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AllTimeRankingDto {
    private int rank;
    private String movieNm;
    private String openDt;
    private long maxAudiAcc;
    private long maxSalesAcc;
}
