package com.ssafy.keepick.image.controller.request;

import com.ssafy.keepick.group.domain.Group;
import com.ssafy.keepick.image.domain.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoCreateRequest {
    private String originalUrl;
    private LocalDateTime takenAt;
    private Integer width;
    private Integer height;

    public Photo toEntity(Group group) {
        return Photo.builder()
                .originalUrl(originalUrl)
                .takenAt(takenAt)
                .width(width)
                .height(height)
                .group(group)
                .build();
    }
}
