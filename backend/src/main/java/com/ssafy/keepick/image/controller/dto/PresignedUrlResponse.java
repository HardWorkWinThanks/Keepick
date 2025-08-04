package com.ssafy.keepick.image.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlResponse {
    private String presignedUrl;

    public static PresignedUrlResponse of(String string) {
        return PresignedUrlResponse.builder()
                .presignedUrl(string)
                .build();
    }
}

