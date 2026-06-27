package pknu26.example.movie.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import pknu26.example.movie.entity.NoDoubleSubmit;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class DoubleSubmitInterceptor implements HandlerInterceptor {

    // 메모리 내에 요청 기록을 저장할 임시 맵 (Thread-Safe)
    private final ConcurrentHashMap<String, Long> requestMap = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        // 실행하려는 컨트롤러의 메서드에 @NoDoubleSubmit 어노테이션이 붙어있는지 확인
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            NoDoubleSubmit noDoubleSubmit = handlerMethod.getMethodAnnotation(NoDoubleSubmit.class);

            if (noDoubleSubmit != null) {
                HttpSession session = request.getSession();
                String sessionId = session.getId();
                String requestURI = request.getRequestURI();
                
                // 식별 키 생성 (세션ID + 요청 경로)
                String key = sessionId + ":" + requestURI;
                long currentTime = System.currentTimeMillis();

                if (requestMap.containsKey(key)) {
                    long lastRequestTime = requestMap.get(key);
                    long allowedInterval = noDoubleSubmit.timeout(); // 어노테이션에 설정된 제한 시간

                    // 제한 시간(2초)이 지나기 전에 똑같은 요청이 또 들어왔다면?
                    if ((currentTime - lastRequestTime) < allowedInterval) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT); // 409 Conflict 에러 반환
                        response.setCharacterEncoding("UTF-8");
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Too Many Requests\", \"message\": \"잠시 후 다시 시도해 주세요. 중복 제출이 방지되었습니다.\"}");
                        return false; // 컨트롤러로 가지 못하게 요청 차단!
                    }
                }
                
                // 새로운 요청 시간 기록 등록
                requestMap.put(key, currentTime);
            }
        }
        
        return true; // 정상 요청은 진행
    }
}