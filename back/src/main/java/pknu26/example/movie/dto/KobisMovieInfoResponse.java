package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KobisMovieInfoResponse {
    private MovieInfoResult movieInfoResult;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MovieInfoResult {
        private MovieInfo movieInfo;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MovieInfo {
        private String movieCd;
        private String movieNm;
        private String movieNmEn;
        private String showTm;
        private String openDt;
        private String prdtStatNm;
        private String typeNm;
        private List<Nation> nations;
        private List<Genre> genres;
        private List<Director> directors;
        private List<Actor> actors;
        private List<Company> companys;
        private List<Audit> audits;
    }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Nation { private String nationNm; }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Genre { private String genreNm; }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Director { private String peopleNm; }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Actor { private String peopleNm; private String cast; }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Company { private String companyNm; private String companyPartNm; }

    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Audit { private String watchGradeNm; }
}
