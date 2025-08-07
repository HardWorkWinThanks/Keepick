package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.photo.domain.Photo;
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

    public static GroupPhotoDto from(Long photoId) {
        return GroupPhotoDto.builder()
                .photoId(photoId)
                .build();
    }
}
