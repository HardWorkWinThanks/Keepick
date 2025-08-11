package com.ssafy.keepick.auth.controller.response;

import lombok.Builder;
import lombok.Getter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "모바일 토큰 갱신 응답")
public class MobileTokenRefreshResponse {

    @Schema(
        description = "새로운 액세스 토큰", 
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    )
    private String accessToken;

    @Schema(
        description = "새로운 리프레시 토큰", 
        example = "5abcde9-b7af-123b-9425-bb01234567-example"
    )
    private String refreshToken;

    public static MobileTokenRefreshResponse of(String accessToken, String refreshToken) {
        return MobileTokenRefreshResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}
