package com.ssafy.keepick.auth.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@NoArgsConstructor
@Schema(description = "모바일 토큰 갱신 요청")
public class MobileTokenRefreshRequest {
    
    @NotBlank(message = "refreshToken은 필수입니다")
    @Schema(
        description = "갱신할 리프레시 토큰", 
        example = "5abcde9-b7af-123b-9425-bb01234567-example"
    )
    private String refreshToken;
    
    public MobileTokenRefreshRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
