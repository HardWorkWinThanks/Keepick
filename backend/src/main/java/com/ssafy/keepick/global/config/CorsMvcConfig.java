package com.ssafy.keepick.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsMvcConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(frontendUrl, "http://localhost:3000")                    // 허용할 origin
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")  // 허용할 HTTP 메서드
                .allowedHeaders("*")                            // 허용할 헤더
                .allowCredentials(true)                         // 쿠키/인증 정보 허용
                .exposedHeaders("Set-Cookie", "Authorization")  // 클라이언트에서 접근할 수 있는 헤더
                .maxAge(3600);                                  // preflight 캐시 시간 (1시간)
    }
} 