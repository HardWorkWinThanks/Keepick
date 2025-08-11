package com.ssafy.keepick.auth.application.dto;

import lombok.Builder;
import lombok.Getter;

import com.ssafy.keepick.auth.controller.response.TokenRefreshResponse;

@Getter
@Builder
public class WebTokenRefreshDto {
    
    private String accessToken;
    private String refreshTokenJti;
    
    public static WebTokenRefreshDto of(String accessToken, String refreshTokenJti) {
        return WebTokenRefreshDto.builder()
                .accessToken(accessToken)
                .refreshTokenJti(refreshTokenJti)
                .build();
    }
    
    public TokenRefreshResponse toResponse() {
        return TokenRefreshResponse.of(accessToken);
    }
}
