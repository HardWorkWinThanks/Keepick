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
public class TimelineInfoResponse {

    @Schema(description = "앨범 ID", example = "101")
    private Long albumId;

    @Schema(description = "앨범 이름", example = "여름 휴가")
    private String name;

    @Schema(description = "앨범 설명", example = "2025년 여름 바다 여행", nullable = true)
    private String description;

    @Schema(description = "앨범 대표 사진 썸네일 URL", example = "https://example.com/thumbnail.jpg")
    private String thumbnailUrl;

    @Schema(description = "앨범 대표 사진 원본 URL", example = "https://example.com/original.jpg")
    private String originalUrl;

    @Schema(description = "앨범 시작 날짜", example = "2025-07-01", nullable = true)
    private LocalDate startDate;

    @Schema(description = "앨범 종료 날짜", example = "2025-07-10", nullable = true)
    private LocalDate endDate;

    @Schema(description = "앨범 내 섹션에 포함된 사진 개수", example = "20")
    private Integer photoCount;

    @Schema(description = "앨범 생성 일시", example = "2025-07-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "앨범 수정 일시", example = "2025-07-05T15:30:00")
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
