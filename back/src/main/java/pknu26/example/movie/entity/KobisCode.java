package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kobis_code",
       indexes = @Index(columnList = "com_code"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KobisCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "com_code", nullable = false)
    private String comCode;

    @Column(name = "full_cd")
    private String fullCd;

    @Column(name = "kor_nm")
    private String korNm;
}
