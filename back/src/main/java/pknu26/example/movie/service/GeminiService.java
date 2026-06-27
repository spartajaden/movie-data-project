package pknu26.example.movie.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pknu26.example.movie.dto.AiCommentaryRequest;
import pknu26.example.movie.dto.GeminiResponseDto;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";
    private static final String MODEL = "qwen3.5:4b";

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateCommentary(AiCommentaryRequest req) {
        String prompt = buildPrompt(req);
        try {
            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "prompt", prompt,
                    "stream", false,
                    "think", false,
                    "options", Map.of("num_predict", 300, "temperature", 0.6)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<GeminiResponseDto> resp = restTemplate.exchange(
                    OLLAMA_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    GeminiResponseDto.class
            );

            GeminiResponseDto respBody = resp.getBody();
            if (respBody == null || respBody.getResponse() == null) {
                log.warn("Ollama 응답 비어있음");
                return null;
            }
            String raw = respBody.getResponse();
            // Qwen thinking 모델의 <think>...</think> 태그 제거
            String text = raw.replaceAll("(?s)<think>.*?</think>", "");
            text = stripHanja(text).trim();
            if (text.isEmpty()) {
                log.warn("Ollama 응답에서 실제 텍스트 없음 (원본 {}자)", raw.length());
                return null;
            }
            return text;
        } catch (Exception e) {
            log.warn("Ollama API 호출 실패: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }

    private static final String COMMON_SUFFIX =
            "\n\n작성 규칙: 반드시 순수 한글로만 작성하세요. 한자(漢字)와 중국어 글자는 절대 사용하지 말고, "
            + "'관객', '매출', '증가', '감소' 처럼 모두 한글로 풀어 쓰세요. "
            + "영어 단어는 철자 그대로 쓰지 말고 반드시 한글 발음으로 표기하세요. "
            + "예: momentum → 모멘텀, box office → 박스오피스, genre → 장르, trend → 트렌드, content → 콘텐츠, ranking → 랭킹, share → 점유율(또는 쉐어). "
            + "마크다운·특수기호 없이 자연스러운 한국어 구어체 문장으로만 작성해주세요.";

    // CJK 한자(漢字) 영역 문자 제거 — Qwen이 간혹 한자를 섞어 출력하는 것을 방지
    // 한글(가-힣)은 유지, 한자 통합/확장A/호환 영역만 제거
    private static final java.util.regex.Pattern HANJA =
            java.util.regex.Pattern.compile("[\\u4E00-\\u9FFF\\u3400-\\u4DBF\\uF900-\\uFAFF]");

    private String stripHanja(String s) {
        return HANJA.matcher(s).replaceAll("");
    }

    private String buildPrompt(AiCommentaryRequest req) {
        return switch (req.getType()) {
            case "daily"   -> buildDailyPrompt(req);
            case "weekly"  -> buildWeeklyPrompt(req, "주간");
            case "weekend" -> buildWeeklyPrompt(req, "주말");
            case "trend"   -> buildTrendPrompt(req);
            default        -> "한국 박스오피스 데이터를 한국어로 분석해주세요.";
        };
    }

    private String buildDailyPrompt(AiCommentaryRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음은 ").append(req.getDate()).append(" 일별 한국 박스오피스 데이터입니다.\n\n");

        List<Map<String, Object>> entries = req.getEntries();
        if (entries != null) {
            for (int i = 0; i < Math.min(entries.size(), 5); i++) {
                Map<String, Object> e = entries.get(i);
                sb.append(e.get("rank")).append("위: ").append(e.get("movieNm")).append("\n");
                sb.append("  관객 ").append(fmtNum(e.get("audiCnt"))).append("명")
                  .append(" / 누적 ").append(fmtNum(e.get("audiAcc"))).append("명")
                  .append(" / 매출 점유율 ").append(e.get("salesShare")).append("%")
                  .append(" / 당일 매출 ").append(fmtNum(e.get("salesAmt"))).append("원\n");
            }
        }

        String focus = req.getChartFocus();
        sb.append("\n");
        if ("ranking".equals(focus)) {
            sb.append("이 데이터를 바탕으로 오늘의 순위 동향과 순위 변동 특징을 2~3문장으로 분석해주세요. ")
              .append("1위 영화와 순위 변화에 집중해주세요.");
        } else if ("sales".equals(focus)) {
            sb.append("이 데이터를 바탕으로 오늘의 매출 현황을 2~3문장으로 분석해주세요. ")
              .append("매출 점유율과 수익 분포를 중심으로 설명해주세요.");
        } else if ("audience".equals(focus)) {
            sb.append("이 데이터를 바탕으로 오늘의 관객 현황을 2~3문장으로 분석해주세요. ")
              .append("당일 관객수와 누적 관객 추이를 중심으로 설명해주세요.");
        } else {
            sb.append("이 데이터를 바탕으로 오늘 박스오피스 전반적인 현황을 2~3문장으로 분석해주세요. ")
              .append("1위 영화와 전반적인 흐름을 포함해주세요.");
        }
        sb.append(COMMON_SUFFIX);
        return sb.toString();
    }

    private String buildWeeklyPrompt(AiCommentaryRequest req, String period) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음은 ").append(formatRange(req.getShowRange())).append(" ")
          .append(period).append(" 한국 박스오피스 데이터입니다.\n\n");

        List<Map<String, Object>> entries = req.getEntries();
        if (entries != null) {
            for (int i = 0; i < Math.min(entries.size(), 5); i++) {
                Map<String, Object> e = entries.get(i);
                sb.append(e.get("rank")).append("위: ").append(e.get("movieNm")).append("\n");
                sb.append("  ").append(period).append(" 관객 ").append(fmtNum(e.get("audiCnt"))).append("명")
                  .append(" / 누적 ").append(fmtNum(e.get("audiAcc"))).append("명")
                  .append(" / 점유율 ").append(e.get("salesShare")).append("%")
                  .append(" / ").append(period).append(" 매출 ").append(fmtNum(e.get("salesAmt"))).append("원\n");
            }
        }

        String focus = req.getChartFocus();
        sb.append("\n");
        if ("ranking".equals(focus)) {
            sb.append("이 ").append(period).append(" 순위 동향과 특징을 2~3문장으로 분석해주세요. ")
              .append("1위 영화와 순위 특징에 집중해주세요.");
        } else if ("sales".equals(focus)) {
            sb.append("이 ").append(period).append(" 매출 현황을 2~3문장으로 분석해주세요. ")
              .append("매출 점유율과 수익 분포를 중심으로 설명해주세요.");
        } else if ("audience".equals(focus)) {
            sb.append("이 ").append(period).append(" 관객 현황을 2~3문장으로 분석해주세요. ")
              .append("관객수와 누적 관객 추이를 중심으로 설명해주세요.");
        } else {
            sb.append("이 기간의 ").append(period).append(" 박스오피스 현황을 2~3문장으로 분석해주세요.");
        }
        sb.append(COMMON_SUFFIX);
        return sb.toString();
    }

    private String buildTrendPrompt(AiCommentaryRequest req) {
        StringBuilder sb = new StringBuilder();

        List<Map<String, Object>> monthly = req.getMonthly();
        List<Map<String, Object>> seasonal = req.getSeasonal();
        boolean hasMonthly = monthly != null && !monthly.isEmpty();
        boolean hasSeasonal = seasonal != null && !seasonal.isEmpty();

        sb.append("다음은 한국 박스오피스 집계 데이터입니다.\n\n");

        if (hasMonthly) {
            sb.append("[월별 데이터]\n");
            monthly.forEach(m -> sb.append(m.get("period")).append(": 총 관객 ")
                    .append(fmtNum(m.get("totalAudience"))).append("명, 1위 ").append(m.get("topMovie")).append("\n"));
        }
        if (hasSeasonal) {
            sb.append("[계절별 데이터]\n");
            seasonal.forEach(s -> sb.append(s.get("period")).append(": 총 관객 ")
                    .append(fmtNum(s.get("totalAudience"))).append("명, 1위 ").append(s.get("topMovie")).append("\n"));
        }

        sb.append("\n");
        if (hasMonthly && !hasSeasonal) {
            sb.append("이 월별 데이터를 바탕으로 관객이 몰리는 달과 비수기 패턴을 3~4문장으로 분석해주세요.");
        } else if (hasSeasonal && !hasMonthly) {
            sb.append("이 계절별 데이터를 바탕으로 어느 계절에 관객이 몰리는지 특징을 3~4문장으로 분석해주세요.");
        } else {
            sb.append("이 데이터를 바탕으로 한국 영화 시장의 계절적 트렌드와 패턴을 3~4문장으로 분석해주세요.");
        }
        sb.append(COMMON_SUFFIX);
        return sb.toString();
    }

    private String formatRange(String showRange) {
        if (showRange == null || !showRange.contains("~")) return showRange;
        String[] parts = showRange.split("~");
        return fmt8(parts[0]) + " ~ " + fmt8(parts[1]);
    }

    private String fmt8(String s) {
        if (s == null || s.length() < 8) return s;
        return s.substring(0, 4) + "." + s.substring(4, 6) + "." + s.substring(6, 8);
    }

    private String fmtNum(Object val) {
        if (val == null) return "0";
        long n = ((Number) val).longValue();
        if (n >= 10_000) return String.format("%.1f만", n / 10_000.0);
        return String.format("%,d", n);
    }
}
