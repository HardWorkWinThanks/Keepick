package com.ssafy.keepick.photo.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUploadDto {
    private final Long photoId;
    private final String presignedUrl;

    public static GroupPhotoUploadDto of (Long photoId, String presignedUrl) {
        return GroupPhotoUploadDto.builder()
                .photoId(photoId)
                .presignedUrl(presignedUrl)
                .build();
    }
}
