package pknu26.example.movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pknu26.example.movie.dto.AiCommentaryRequest;
import pknu26.example.movie.service.GeminiService;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    private final GeminiService geminiService;

    @PostMapping("/commentary")
    public ResponseEntity<Map<String, String>> getCommentary(@RequestBody AiCommentaryRequest req) {
        String text = geminiService.generateCommentary(req);
        if (text == null) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI 분석을 가져오지 못했습니다."));
        }
        return ResponseEntity.ok(Map.of("text", text));
    }
}
