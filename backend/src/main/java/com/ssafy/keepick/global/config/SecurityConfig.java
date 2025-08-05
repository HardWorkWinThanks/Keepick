package com.ssafy.keepick.global.config;

import com.ssafy.keepick.auth.application.CustomOAuth2MemberService;
import com.ssafy.keepick.global.security.filter.JWTFilter;
import com.ssafy.keepick.global.security.handler.CustomAuthenticationEntryPoint;
import com.ssafy.keepick.global.security.handler.CustomSuccessHandler;
import com.ssafy.keepick.global.security.util.JWTUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2MemberService customOAuth2MemberService;
    private final CustomSuccessHandler customSuccessHandler;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final JWTUtil jwtUtil;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // 기본 보안 설정 해제 (REST API 스타일)
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        // JWT 인증 필터 등록 (OAuth2 인증 필터 이후에 실행)
        http.addFilterAfter(new JWTFilter(jwtUtil), OAuth2LoginAuthenticationFilter.class);

        // CORS 설정
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // OAuth2 소셜 로그인 설정
        http.oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(config -> config.baseUri("/api/oauth2/authorization"))
                .redirectionEndpoint(config -> config.baseUri("/api/login/oauth2/code/*"))
                .userInfoEndpoint(config -> config.userService(customOAuth2MemberService))
                .successHandler(customSuccessHandler) // 로그인 성공 시 JWT 발급 등 처리
        );

        // 경로별 권한 설정
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        // OAuth2 관련 경로
                        "/api/oauth2/**",
                        "/api/login/oauth2/**",
                        // 모바일 인증 관련 경로
                        "/api/auth/login",
                        // Swagger 문서 관련 경로
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/api-docs")
                .permitAll()
                .anyRequest().authenticated());

        // 세션 사용 안함 (JWT 방식)
        http.sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // 인증 예외 처리: 로그인 안 된 사용자에게 401 JSON 응답
        http.exceptionHandling(handler -> handler
                .authenticationEntryPoint(customAuthenticationEntryPoint));

        return http.build();
    }

    // CORS 설정 분리
    private CorsConfigurationSource corsConfigurationSource() {
        return request -> {
            CorsConfiguration config = new CorsConfiguration();

            config.setAllowedOrigins(Collections.singletonList(frontendUrl)); // 프론트 주소
            config.setAllowedMethods(Collections.singletonList("*")); // 모든 HTTP 메서드 허용
            config.setAllowedHeaders(Collections.singletonList("*")); // 모든 헤더 허용
            config.setAllowCredentials(true); // 쿠키 전송 허용
            config.setMaxAge(3600L); // pre-flight 요청 캐싱 시간
            config.setExposedHeaders(Arrays.asList("Set-Cookie", "Authorization")); // 클라이언트에서 접근 가능한 헤더

            return config;
        };
    }
}
