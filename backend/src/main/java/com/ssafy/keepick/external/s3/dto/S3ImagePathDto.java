package com.ssafy.keepick.external.s3.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class S3ImagePathDto {
    private String presignedUrl;
    private String publicUrl;

    public static S3ImagePathDto of(String presignedUrl, String publicUrl) {
        return new S3ImagePathDto(presignedUrl, publicUrl);
    }
}
