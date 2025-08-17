package com.ssafy.keepick.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.auth.application.MobileAuthService;
import com.ssafy.keepick.auth.application.AuthService;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.auth.controller.response.MobileTokenRefreshResponse;
import com.ssafy.keepick.auth.controller.response.TokenRefreshResponse;
import com.ssafy.keepick.global.response.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController implements AuthApiSpec {
    
    private final MobileAuthService mobileAuthService;
    private final AuthService authService;
    
    @PostMapping("/login")
    @Override
    public ApiResponse<MobileLoginResponse> login(@Valid @RequestBody MobileLoginRequest request) {
        log.info("모바일 로그인 요청: provider = {}", request.getProvider());
        
        var loginDto = mobileAuthService.login(request);
        MobileLoginResponse response = loginDto.toResponse();
        
        log.info("모바일 로그인 성공: accessToken 발급 완료");
        
        return ApiResponse.ok(response);
    }
    
    @PostMapping("/token/refresh")
    @Override
    public ApiResponse<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        log.info("토큰 갱신 요청 (웹/모바일 자동 감지)");
        
        var refreshDto = authService.refreshToken(request, response);
        
        // DTO 타입에 따라 적절한 응답 변환
        if (refreshDto instanceof com.ssafy.keepick.auth.application.dto.WebTokenRefreshDto webDto) {
            TokenRefreshResponse body = webDto.toResponse();
            log.info("웹 액세스 토큰 갱신 성공");
            return ApiResponse.ok(body);
        } else if (refreshDto instanceof com.ssafy.keepick.auth.application.dto.MobileTokenRefreshDto mobileDto) {
            MobileTokenRefreshResponse body = mobileDto.toResponse();
            log.info("모바일 액세스 토큰 갱신 성공");
            return ApiResponse.ok(body);
        } else {
            log.error("알 수 없는 DTO 타입: {}", refreshDto.getClass().getSimpleName());
            throw new RuntimeException("알 수 없는 응답 타입");
        }
    }
}