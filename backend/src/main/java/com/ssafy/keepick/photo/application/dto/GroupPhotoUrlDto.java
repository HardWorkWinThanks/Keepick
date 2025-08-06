package com.ssafy.keepick.photo.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUrlDto {
    private Long photoId;
    private String url;

    public static GroupPhotoUrlDto of(Long photoId, String url) {
        return GroupPhotoUrlDto.builder()
                .photoId(photoId)
                .url(url)
                .build();
    }
}
