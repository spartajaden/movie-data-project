package pknu26.example.movie.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final DoubleSubmitInterceptor doubleSubmitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 중복 제출 방지 인터셉터를 스프링 시스템에 등록합니다.
        registry.addInterceptor(doubleSubmitInterceptor)
                .addPathPatterns("/**"); // 모든 경로의 API 요청을 감시
    }
}