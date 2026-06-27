package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KobisMovieListResponse {
    private MovieListResult movieListResult;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MovieListResult {
        private int totCnt;
        private List<MovieItem> movieList;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MovieItem {
        private String movieCd;
        private String movieNm;
        private String movieNmEn;
        private String prdtYear;
        private String openDt;
        private String typeNm;
        private String prdtStatNm;
        private String nationAlt;
        private String genreAlt;
        private String repNationNm;
        private String repGenreNm;
        private List<Director> directors;
        private List<Company> companys;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Director {
        private String peopleNm;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Company {
        private String companyCd;
        private String companyNm;
    }
}
