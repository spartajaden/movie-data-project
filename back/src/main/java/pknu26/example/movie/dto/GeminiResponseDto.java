package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiResponseDto {
    private String model;
    private String response;
    private Boolean done;
}
