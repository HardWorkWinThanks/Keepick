package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.external.s3.dto.S3ImagePathDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ImageUploadResponse {
    private String presignedUrl;
    private String publicUrl;

    public static ImageUploadResponse from(S3ImagePathDto dto) {
        return ImageUploadResponse.builder()
                .presignedUrl(dto.getPresignedUrl())
                .publicUrl(dto.getPublicUrl())
                .build();
    }
}
