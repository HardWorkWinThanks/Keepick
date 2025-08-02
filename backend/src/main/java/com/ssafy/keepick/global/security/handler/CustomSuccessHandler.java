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

@Component
@RequiredArgsConstructor
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JWTUtil jwtUtil;

    @Value("${cookie.maxAge:86400}")
    private int cookieMaxAge;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        // OAuth2User
        CustomOAuth2Member customUserDetails = (CustomOAuth2Member) authentication.getPrincipal();

        String username = customUserDetails.getUsername();

        String token = jwtUtil.createToken(customUserDetails.getMemberId(), username);

        response.addCookie(createCookie("Authorization", token));
        response.sendRedirect(frontendUrl + "/");
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setHttpOnly(true);      // XSS 방지
        cookie.setSecure(true);        // HTTPS에서만 전송
        cookie.setMaxAge(cookieMaxAge); // 환경변수로 설정된 시간
        cookie.setPath("/");           // 전체 경로에서 사용
        return cookie;
    }
}
