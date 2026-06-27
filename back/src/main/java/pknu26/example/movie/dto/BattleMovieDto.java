package pknu26.example.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleMovieDto {
    private String movieNm;
    private String openDt;
    private long audiAcc;
    private long salesAcc;
    private long scrnCnt;
}
