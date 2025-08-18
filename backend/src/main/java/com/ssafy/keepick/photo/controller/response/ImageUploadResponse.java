package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.external.s3.dto.S3ImagePathDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ImageUploadResponse {
    @Schema(description = "사진을 업로드 할 presigned url. not null")
    private String presignedUrl;
    @Schema(description = "사진이 영구 저장될 url로 사진 저장을 요청할 때 사용되는 url이다. not null")
    private String publicUrl;

    public static ImageUploadResponse from(S3ImagePathDto dto) {
        return ImageUploadResponse.builder()
                .presignedUrl(dto.getPresignedUrl())
                .publicUrl(dto.getPublicUrl())
                .build();
    }
}
