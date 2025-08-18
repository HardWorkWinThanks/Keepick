package com.ssafy.keepick.auth.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@NoArgsConstructor
@Schema(description = "모바일 로그인 요청")
public class MobileLoginRequest {
    
    @NotBlank(message = "provider는 필수입니다")
    @Schema(
        description = "소셜 로그인 제공자", 
        example = "kakao",
        allowableValues = {"kakao", "google", "naver"}
    )
    private String provider;
    
    @NotBlank(message = "accessToken은 필수입니다")
    @Schema(
        description = "소셜 로그인 제공자로부터 받은 access token", 
        example = "kakao_access_token_here"
    )
    private String accessToken;
    
    public MobileLoginRequest(String provider, String accessToken) {
        this.provider = provider;
        this.accessToken = accessToken;
    }
}