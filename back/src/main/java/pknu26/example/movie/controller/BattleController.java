package pknu26.example.movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pknu26.example.movie.dto.BattleMovieDto;
import pknu26.example.movie.entity.DailyBoxOffice;
import pknu26.example.movie.repository.DailyBoxOfficeRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BattleController {

    private final DailyBoxOfficeRepository dailyBoxOfficeRepository;

    @GetMapping("/battle/pool")
    public List<BattleMovieDto> getBattlePool() {
        List<DailyBoxOffice> all = dailyBoxOfficeRepository.findAll();

        // 영화별로 audiAcc가 가장 높은 항목(누적치가 가장 큰 = 가장 최신) 하나씩 추출
        Map<String, DailyBoxOffice> best = all.stream()
                .collect(Collectors.toMap(
                        DailyBoxOffice::getMovieNm,
                        d -> d,
                        (a, b) -> a.getAudiAcc() >= b.getAudiAcc() ? a : b
                ));

        return best.values().stream()
                .map(d -> BattleMovieDto.builder()
                        .movieNm(d.getMovieNm())
                        .openDt(d.getOpenDt())
                        .audiAcc(d.getAudiAcc())
                        .salesAcc(d.getSalesAcc())
                        .scrnCnt(d.getScrnCnt())
                        .build())
                .collect(Collectors.toList());
    }
}
