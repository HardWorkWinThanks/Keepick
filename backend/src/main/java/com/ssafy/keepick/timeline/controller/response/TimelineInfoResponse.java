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
public class TimelineInfoResponse {

    private Long albumId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer photoCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TimelineInfoResponse toResponse(TimelineAlbumDto dto) {
        return TimelineInfoResponse
                .builder()
                .albumId(dto.getAlbumId())
                .name(dto.getName())
                .description(dto.getDescription())
                .thumbnailUrl(dto.getThumbnailUrl())
                .originalUrl(dto.getOriginalUrl())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .photoCount(dto.getPhotoCount())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }

}
