package com.ssafy.keepick.auth.controller.response;

import lombok.Builder;
import lombok.Getter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "모바일 로그인 응답")
public class MobileLoginResponse {

    @Schema(
        description = "서비스 JWT 토큰 (인증 및 인가용)", 
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    )
    private String accessToken;

    @Schema(
        description = "리프레시 토큰 (액세스 토큰 갱신용)", 
        example = "5abcde9-b7af-123b-9425-bb01234567-example"
    )
    private String refreshToken;

    public static MobileLoginResponse of(String accessToken, String refreshToken) {
        return MobileLoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}