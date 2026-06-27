package pknu26.example.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiCommentaryRequest {
    private String type;          // "daily" | "weekly" | "weekend" | "trend"
    private String date;          // 일별용 (yyyy-MM-dd)
    private String showRange;     // 주간/주말용 (yyyyMMdd~yyyyMMdd)
    private String chartFocus;    // null | "ranking" | "sales" | "audience"
    private List<Map<String, Object>> entries;   // 일별/주간 순위 데이터
    private List<Map<String, Object>> monthly;   // 트렌드 월별
    private List<Map<String, Object>> seasonal;  // 트렌드 계절별
}
