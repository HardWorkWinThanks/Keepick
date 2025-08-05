package com.ssafy.keepick.global.security.handler;

import java.io.IOException;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;

import com.ssafy.keepick.global.security.util.JWTUtil;
import jakarta.servlet.http.Cookie;
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

    @Value("${cookie.maxAge}")
    private int cookieMaxAge;

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

        log.debug("🔑 JWT 토큰 생성 완료: 사용자: {} | 토큰 길이: {} | 만료시간: {}초",
                username, token.length(), cookieMaxAge);
        
        response.addCookie(createCookie("Authorization", token));
        response.sendRedirect(frontendUrl + "/");
        
        log.info("🔄 프론트엔드 리다이렉트: {} | 사용자: {}", frontendUrl + "/", username);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setHttpOnly(false); // JS에서 접근 가능
        cookie.setSecure(true);        // HTTPS에서만 전송
        cookie.setMaxAge(cookieMaxAge); // 환경변수로 설정된 시간
        cookie.setPath("/");           // 전체 경로에서 사용
        return cookie;
    }
}
