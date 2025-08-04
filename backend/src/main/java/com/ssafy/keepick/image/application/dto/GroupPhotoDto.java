package com.ssafy.keepick.image.application.dto;

import com.ssafy.keepick.image.domain.Photo;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupPhotoDto {
    private Long photoId;
    private String originalUrl;
    private String thumbnailUrl;
    private LocalDateTime takenAt;
    private Integer width;
    private Integer height;

    public static GroupPhotoDto from(Photo Photo) {
        return GroupPhotoDto.builder()
                .photoId(Photo.getId())
                .originalUrl(Photo.getOriginalUrl())
                .thumbnailUrl(Photo.getThumbnailUrl())
                .takenAt(Photo.getTakenAt())
                .width(Photo.getWidth())
                .height(Photo.getHeight())
                .build();
    }
}
