package com.ssafy.keepick.external.visionai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileValidateResponse {
    @JsonProperty("is_valid")
    private boolean isValid;
    @JsonProperty("error_code")
    private String errorCode;
    @JsonProperty("message")
    private String message;
}
