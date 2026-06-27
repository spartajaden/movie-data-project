package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "daily_box_office",
        indexes = @Index(columnList = "date"),
        uniqueConstraints = @UniqueConstraint(
                name = "uk_daily_date_rank",
                columnNames = {"date", "rank"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyBoxOffice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "`date`", nullable = false)
    private String date;  // YYYY-MM-DD

    @Column(name = "`rank`")
    private int rank;

    @Column(name = "rank_inten")
    private int rankInten;

    @Column(name = "rank_old_and_new")
    private String rankOldAndNew;

    @Column(name = "movie_nm")
    private String movieNm;

    @Column(name = "open_dt")
    private String openDt;

    @Column(name = "sales_amt")
    private long salesAmt;

    @Column(name = "sales_share")
    private double salesShare;

    @Column(name = "sales_inten")
    private long salesInten;

    @Column(name = "sales_change")
    private double salesChange;

    @Column(name = "sales_acc")
    private long salesAcc;

    @Column(name = "audi_cnt")
    private long audiCnt;

    @Column(name = "audi_inten")
    private long audiInten;

    @Column(name = "audi_change")
    private double audiChange;

    @Column(name = "audi_acc")
    private long audiAcc;

    @Column(name = "scrn_cnt")
    private long scrnCnt;

    @Column(name = "show_cnt")
    private long showCnt;
}
