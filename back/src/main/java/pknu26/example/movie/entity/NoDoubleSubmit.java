package pknu26.example.movie.entity;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // 👈 메서드에만 붙일 수 있도록 설정
@Retention(RetentionPolicy.RUNTIME) // 👈 서버가 가동 중일 때 실행되도록 설정
public @interface NoDoubleSubmit {
    // 중복 요청을 방지할 대기 시간 (기본값: 2초)
    long timeout() default 2000; 
}