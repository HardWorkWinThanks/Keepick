package com.ssafy.keepick.global.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        String method = request.getMethod();
        String requestURI = request.getRequestURI();
        String userAgent = request.getHeader("User-Agent");

        log.warn("🚨 CustomAuthenticationEntryPoint 호출됨!");
        log.warn("🔒 인증 실패 상세: {} {} | User-Agent: {} | Exception: {}", 
                method, requestURI, userAgent, authException.getMessage());

        // 응답 설정
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // ErrorResponse 생성
        ErrorResponse errorResponse = ErrorResponse.of(ErrorCode.UNAUTHORIZED);

        // JSON으로 응답
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }
}