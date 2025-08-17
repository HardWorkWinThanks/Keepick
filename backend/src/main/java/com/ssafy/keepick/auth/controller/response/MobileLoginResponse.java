package com.ssafy.keepick.auth.controller.response;

import lombok.Builder;
import lombok.Getter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "모바일 로그인 응답")
public class MobileLoginResponse {

    @Schema(
        description = "JWT 액세스 토큰", 
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    )
    private String accessToken;

    public static MobileLoginResponse of(String accessToken) {
        return MobileLoginResponse.builder()
                .accessToken(accessToken)
                .build();
    }
}