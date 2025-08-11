package com.ssafy.keepick.auth.application.dto;

import lombok.Builder;
import lombok.Getter;

import com.ssafy.keepick.auth.controller.response.MobileTokenRefreshResponse;

@Getter
@Builder
public class MobileTokenRefreshDto {
    
    private String accessToken;
    private String refreshTokenJti;
    
    public static MobileTokenRefreshDto of(String accessToken, String refreshTokenJti) {
        return MobileTokenRefreshDto.builder()
                .accessToken(accessToken)
                .refreshTokenJti(refreshTokenJti)
                .build();
    }
    
    public MobileTokenRefreshResponse toResponse() {
        return MobileTokenRefreshResponse.of(accessToken, refreshTokenJti);
    }
}
