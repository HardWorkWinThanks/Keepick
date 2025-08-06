package com.ssafy.keepick.global.security.handler;

import java.io.IOException;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;

import com.ssafy.keepick.global.security.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
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
        
        // 쿼리 스트링으로 JWT 토큰 전달
        String redirectUrl = frontendUrl + "/?token=" + token;
        response.sendRedirect(redirectUrl);
        
        log.info("🔄 프론트엔드 리다이렉트: {} | 사용자: {}", redirectUrl, username);
    }
}
