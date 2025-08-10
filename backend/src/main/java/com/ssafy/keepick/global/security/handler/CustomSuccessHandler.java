package com.ssafy.keepick.global.security.handler;

import java.io.IOException;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;

import com.ssafy.keepick.global.security.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JWTUtil jwtUtil;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        
        String userAgent = request.getHeader("User-Agent");
        
        // OAuth2User
        CustomOAuth2Member customUserDetails = (CustomOAuth2Member) authentication.getPrincipal();
        String username = customUserDetails.getUsername();
        Long memberId = customUserDetails.getMemberId();

        log.info("🎉 OAuth2 로그인 성공: 사용자: {} (ID: {}) | User-Agent: {}",
                username, memberId, userAgent);

        String token = jwtUtil.createToken(memberId, username);

        log.debug("🔑 JWT 토큰 생성 완료: 사용자: {} | 토큰 길이: {}",
                username, token.length());
        
        // JWT 토큰을 HttpOnly 쿠키로 설정 (ResponseCookie 사용)
        ResponseCookie tokenCookie = ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(true) // HTTPS 환경이므로 true
                .path("/")
                .maxAge(3600) // 1시간 유효
                .sameSite("None") // Cross-origin을 위해 필요
                .build();
        
        response.addHeader("Set-Cookie", tokenCookie.toString());
        
        log.info("🍪 ResponseCookie 설정 완료: SameSite=None, Secure=true");
        
        // 프론트엔드로 리다이렉트 (토큰은 쿠키에 포함됨)
        response.sendRedirect(frontendUrl);
        
        log.info("🔄 프론트엔드 리다이렉트: {} | 사용자: {}", frontendUrl, username);
    }
}
