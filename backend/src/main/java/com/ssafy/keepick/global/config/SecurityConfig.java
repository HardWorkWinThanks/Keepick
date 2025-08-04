package com.ssafy.keepick.global.config;

import java.util.Collections;

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

import com.ssafy.keepick.auth.application.CustomOAuth2MemberService;
import com.ssafy.keepick.global.security.filter.JWTFilter;
import com.ssafy.keepick.global.security.handler.CustomSuccessHandler;
import com.ssafy.keepick.global.security.util.JWTUtil;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2MemberService customOAuth2MemberService;
    private final CustomSuccessHandler customSuccessHandler;
    private final JWTUtil jwtUtil;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // csrf disable
        http
                .csrf((auth) -> auth.disable());

        // From 로그인 방식 disable
        http
                .formLogin((auth) -> auth.disable());

        // HTTP Basic 인증 방식 disable
        http
                .httpBasic((auth) -> auth.disable());

        // JWT Filter
        http.addFilterAfter(new JWTFilter(jwtUtil), OAuth2LoginAuthenticationFilter.class);

        // oauth2
        http
                .oauth2Login((oauth2) -> oauth2
                        .authorizationEndpoint((authorization) -> authorization
                                .baseUri("/api/oauth2/authorization"))
                        .redirectionEndpoint((redirection) -> redirection
                                .baseUri("/api/login/oauth2/code/*"))
                        .userInfoEndpoint((userInfoEndpointConfig) -> userInfoEndpointConfig
                                .userService(customOAuth2MemberService))
                        .successHandler(customSuccessHandler));

        // cors
        http
                .cors(corsCustomizer -> corsCustomizer
                        .configurationSource(new CorsConfigurationSource() {
                            @Override
                            public CorsConfiguration getCorsConfiguration(
                                    HttpServletRequest request) {

                                CorsConfiguration configuration = new CorsConfiguration();

                                // 허용할 도메인 (환경변수 사용)
                                configuration.setAllowedOrigins(
                                        Collections.singletonList(frontendUrl));

                                // 허용할 HTTP 메서드
                                configuration.setAllowedMethods(
                                        Collections.singletonList("*"));
                                configuration.setAllowCredentials(true);
                                configuration.setAllowedHeaders(
                                        Collections.singletonList("*"));
                                configuration.setMaxAge(3600L);

                                // 클라이언트에서 접근할 수 있는 헤더 (한 번에 설정)
                                configuration.setExposedHeaders(java.util.Arrays
                                        .asList("Set-Cookie", "Authorization"));

                                return configuration;
                            }
                        }));

        // 경로별 인가 작업
        http
                .authorizeHttpRequests((auth) -> auth
                        // OAuth 로그인 관련 경로만 인증 불필요
                        .requestMatchers("/api/login/oauth2/**", "/api/oauth2/**").permitAll()
                        
                        // 개발용 (필요시 주석 해제)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/api-docs").permitAll()
                        
                        // 나머지 모든 요청은 인증 필요 (API 포함)
                        .anyRequest().authenticated());

        // 세션 설정 : STATELESS
        http
                .sessionManagement((session) -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}