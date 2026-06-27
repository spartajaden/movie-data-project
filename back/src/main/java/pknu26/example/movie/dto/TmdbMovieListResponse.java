package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TmdbMovieListResponse {
    private List<TmdbMovieItem> results;

    @JsonProperty("total_pages")
    private Integer totalPages;
}
