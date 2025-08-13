package com.ssafy.keepick.external.visionai.request;


import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ProfileValidateRequest {
    private String imageUrl;
    private String personName;

    public static ProfileValidateRequest of(String imageUrl, String personName) {
        return ProfileValidateRequest.builder()
                .imageUrl(imageUrl)
                .personName(personName)
                .build();
    }
}
