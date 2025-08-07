package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
public class TimelineCreateResponse {

    private Long albumId;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private Integer photoCount;

    public static TimelineCreateResponse toResponse(TimelineAlbumDto dto) {
        return TimelineCreateResponse
                .builder()
                .albumId(dto.getAlbumId())
                .thumbnailUrl(dto.getOriginalUrl())
                .createdAt(dto.getCreatedAt())
                .photoCount(dto.getPhotoCount())
                .build();
    }

}
