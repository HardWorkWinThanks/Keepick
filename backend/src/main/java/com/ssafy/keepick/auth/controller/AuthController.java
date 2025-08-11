package com.ssafy.keepick.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.auth.application.MobileLoginService;
import com.ssafy.keepick.auth.application.AuthService;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.auth.controller.response.TokenRefreshResponse;
import com.ssafy.keepick.global.response.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController implements AuthApiSpec {
    
    private final MobileLoginService mobileLoginService;
    private final AuthService authService;
    
    @PostMapping("/login")
    @Override
    public ApiResponse<MobileLoginResponse> login(@Valid @RequestBody MobileLoginRequest request) {
        log.info("모바일 로그인 요청: provider = {}", request.getProvider());
        
        MobileLoginResponse response = mobileLoginService.login(request);
        
        log.info("모바일 로그인 성공: accessToken 발급 완료");
        
        return ApiResponse.ok(response);
    }
    
    @PostMapping("/token/refresh")
    @Override
    public ApiResponse<TokenRefreshResponse> refreshToken(jakarta.servlet.http.HttpServletRequest request) {
        log.info("토큰 갱신 요청");
        
        TokenRefreshResponse response = authService.refreshToken(request);
        
        log.info("토큰 갱신 성공");
        
        return ApiResponse.ok(response);
    }
}