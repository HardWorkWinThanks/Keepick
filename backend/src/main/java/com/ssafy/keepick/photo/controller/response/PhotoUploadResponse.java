package com.ssafy.keepick.photo.controller.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoUploadResponse {
    private String presignedUrl;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long imageId;

    public static PhotoUploadResponse of(String presignedUrl, Long imageId) {
        return PhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .imageId(imageId)
                .build();
    }

    public static PhotoUploadResponse of(String presignedUrl) {
        return PhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .build();
    }
}

