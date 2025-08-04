package com.ssafy.keepick.auth.controller.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MobileLoginResponse {

    private String accessToken;

    public static MobileLoginResponse of(String accessToken) {
        return MobileLoginResponse.builder()
                .accessToken(accessToken)
                .build();
    }
}