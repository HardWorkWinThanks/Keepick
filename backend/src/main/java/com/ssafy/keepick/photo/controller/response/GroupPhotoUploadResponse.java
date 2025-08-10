package com.ssafy.keepick.photo.controller.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUploadResponse {
    private String presignedUrl;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long imageId;

    public static GroupPhotoUploadResponse of(String presignedUrl, Long imageId) {
        return GroupPhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .imageId(imageId)
                .build();
    }

    public static GroupPhotoUploadResponse of(String presignedUrl) {
        return GroupPhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .build();
    }
}

