package com.ssafy.keepick.photo.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUrlDto {
    private Long ImageId;
    private String url;

    public static GroupPhotoUrlDto of(Long ImageId, String url) {
        return GroupPhotoUrlDto.builder()
                .ImageId(ImageId)
                .url(url)
                .build();
    }
}
