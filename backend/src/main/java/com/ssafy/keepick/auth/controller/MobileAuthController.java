package com.ssafy.keepick.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.auth.application.MobileLoginService;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.global.response.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MobileAuthController {
    
    private final MobileLoginService mobileLoginService;
    
    @PostMapping("/login")
    public ApiResponse<MobileLoginResponse> login(@Valid @RequestBody MobileLoginRequest request) {
        log.info("모바일 로그인 요청: provider = {}", request.getProvider());
        
        MobileLoginResponse response = mobileLoginService.login(request);
        
        log.info("모바일 로그인 성공: accessToken 발급 완료");
        
        return ApiResponse.ok(response);
    }
}