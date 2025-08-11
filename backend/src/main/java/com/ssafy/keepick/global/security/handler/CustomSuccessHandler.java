package com.ssafy.keepick.global.security.handler;

import java.io.IOException;
import java.util.UUID;

import com.ssafy.keepick.auth.application.RefreshTokenService;
import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;

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
    private final RefreshTokenService refreshTokenService;

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

        // 리프레시 토큰 발급 (새로운 패밀리 ID 생성)
        String familyId = UUID.randomUUID().toString();
        String refreshTokenJti = refreshTokenService.issue(memberId, username, familyId);

        log.debug("🔄 리프레시 토큰 발급 완료: 사용자: {} | JTI: {} | 패밀리: {}",
                username, refreshTokenJti, familyId);
        
        // 리프레시 토큰을 HttpOnly 쿠키로 설정 (ResponseCookie 사용)
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", refreshTokenJti)
                .httpOnly(true)
                .secure(true) // HTTPS 환경이므로 true
                .path("/")
                .maxAge(30 * 24 * 60 * 60) // 30일 유효
                .sameSite("None") // Cross-origin을 위해 필요
                .build();
        
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
        
        log.info("🍪 리프레시 토큰 쿠키 설정 완료: SameSite=None, Secure=true, TTL=30일");
        
        // 프론트엔드로 리다이렉트 (리프레시 토큰은 쿠키에 포함됨)
        response.sendRedirect(frontendUrl);
        
        log.info("🔄 프론트엔드 리다이렉트: {} | 사용자: {}", frontendUrl, username);
    }
}
