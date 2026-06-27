package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kobis_movie")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KobisMovie {

    @Id
    @Column(name = "movie_cd")
    private String movieCd;

    @Column(name = "movie_nm")
    private String movieNm;

    @Column(name = "movie_nm_en")
    private String movieNmEn;

    @Column(name = "prdt_year")
    private String prdtYear;

    @Column(name = "open_dt")
    private String openDt;

    @Column(name = "type_nm")
    private String typeNm;

    @Column(name = "prdt_stat_nm")
    private String prdtStatNm;

    @Column(name = "nation_alt")
    private String nationAlt;

    @Column(name = "genre_alt")
    private String genreAlt;

    @Column(name = "show_tm")
    private Integer showTm;

    @Column(name = "directors", length = 500)
    private String directors;

    @Column(name = "actors", length = 1000)
    private String actors;

    @Column(name = "companys", length = 500)
    private String companys;

    @Column(name = "watch_grade_nm")
    private String watchGradeNm;
}
