package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
public class TimelineCreateResponse {

    @Schema(description = "생성된 앨범 ID", example = "101")
    private Long albumId;

    @Schema(description = "앨범 대표 사진 썸네일 URL (앨범 생성 요청 시 전달된 사진 중 첫번째 사진을 썸네일로 한다)", example = "https://example.com/thumbnail.jpg")
    private String thumbnailUrl;

    @Schema(description = "앨범 생성 일시", example = "2025-08-09T15:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "앨범 내 섹션에 포함된 사진 개수 (앨범 생성 시점에는 항상 0)", example = "0")
    private Integer photoCount;

    public static TimelineCreateResponse toResponse(TimelineAlbumDto dto) {
        return TimelineCreateResponse
                .builder()
                .albumId(dto.getAlbumId())
                .thumbnailUrl(dto.getThumbnailUrl())
                .createdAt(dto.getCreatedAt())
                .photoCount(dto.getPhotoCount())
                .build();
    }

}
