package pknu26.example.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GenreStatResponse {
    private String genre;       // 장르 이름 (예: Drama, Action)
    private Long movieCount;    // 해당 장르의 영화 수
    private Double avgVote;     // 해당 장르의 평균 평점
}