package pknu26.example.movie.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TmdbMovie {

    @Id
    private Long id;  // TMDB movie ID (자동 생성 아님)

    @Column(nullable = false)
    private String title;

    @JsonProperty("original_title")
    @Column(name = "original_title")
    private String originalTitle;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @JsonProperty("release_date")
    @Column(name = "release_date")
    private String releaseDate;

    @JsonProperty("vote_average")
    @Column(name = "vote_average")
    private Double voteAverage;

    @JsonProperty("vote_count")
    @Column(name = "vote_count")
    private Long voteCount;

    private Double popularity;

    @JsonProperty("poster_path")
    @Column(name = "poster_path")
    private String posterPath;

    @JsonProperty("backdrop_path")
    @Column(name = "backdrop_path")
    private String backdropPath;

    @JsonProperty("movie_cd")
    @Column(name = "movie_cd")
    private String movieCd;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "movie_genres", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "genre")
    private List<String> genres = new ArrayList<>();

}
