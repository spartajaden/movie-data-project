package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "weekly_box_office",
       indexes = @Index(columnList = "show_range, week_gb"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyBoxOffice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "show_range", nullable = false)
    private String showRange;

    @Column(name = "week_gb", nullable = false)
    private String weekGb;

    @Column(name = "`rank`")
    private int rank;

    @Column(name = "movie_cd")
    private String movieCd;

    @Column(name = "movie_nm")
    private String movieNm;

    @Column(name = "open_dt")
    private String openDt;

    @Column(name = "sales_amt")
    private long salesAmt;

    @Column(name = "sales_share")
    private double salesShare;

    @Column(name = "sales_acc")
    private long salesAcc;

    @Column(name = "audi_cnt")
    private long audiCnt;

    @Column(name = "audi_acc")
    private long audiAcc;

    @Column(name = "scrn_cnt")
    private long scrnCnt;

    @Column(name = "show_cnt")
    private long showCnt;
}
