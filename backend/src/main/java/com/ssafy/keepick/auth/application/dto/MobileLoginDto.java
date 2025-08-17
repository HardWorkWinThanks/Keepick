package com.ssafy.keepick.auth.application.dto;

import lombok.Builder;
import lombok.Getter;

import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;

@Getter
@Builder
public class MobileLoginDto {
    
    private String accessToken;
    private String refreshTokenJti;
    
    public static MobileLoginDto of(String accessToken, String refreshTokenJti) {
        return MobileLoginDto.builder()
                .accessToken(accessToken)
                .refreshTokenJti(refreshTokenJti)
                .build();
    }
    
    public MobileLoginResponse toResponse() {
        return MobileLoginResponse.of(accessToken, refreshTokenJti);
    }
}
