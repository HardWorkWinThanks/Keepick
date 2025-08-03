package com.ssafy.keepick.auth.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MobileLoginRequest {
    
    @NotBlank(message = "provider는 필수입니다")
    private String provider;
    
    @NotBlank(message = "accessToken은 필수입니다")
    private String accessToken;
    
    public MobileLoginRequest(String provider, String accessToken) {
        this.provider = provider;
        this.accessToken = accessToken;
    }
}