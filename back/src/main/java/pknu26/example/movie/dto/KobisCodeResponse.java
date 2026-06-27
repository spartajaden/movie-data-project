package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KobisCodeResponse {
    private List<CodeItem> codes;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CodeItem {
        private String fullCd;
        private String korNm;
    }
}
