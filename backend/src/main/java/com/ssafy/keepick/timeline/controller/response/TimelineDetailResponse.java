package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumSectionDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@ToString
public class TimelineDetailResponse {

    @Schema(description = "앨범 ID", example = "101")
    private Long albumId;

    @Schema(description = "앨범 이름", example = "여름 여행")
    private String name;

    @Schema(description = "앨범 설명", example = "2025년 여름 바다 여행 기록")
    private String description;

    @Schema(description = "앨범 썸네일 이미지 URL", example = "https://example.com/thumbnail.jpg")
    private String thumbnailUrl;

    @Schema(description = "앨범 썸네일 원본 이미지 URL", example = "https://example.com/original.jpg")
    private String originalUrl;

    @Schema(description = "앨범 시작 날짜", example = "2025-07-01")
    private LocalDate startDate;

    @Schema(description = "앨범 종료 날짜", example = "2025-07-10")
    private LocalDate endDate;

    @Schema(description = "앨범 내 섹션에 포함된 사진 개수", example = "20")
    private Integer photoCount;

    @Schema(description = "앨범 생성 일시", example = "2025-07-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "앨범 수정 일시", example = "2025-07-05T15:30:00")
    private LocalDateTime updatedAt;

    @Schema(description = "앨범 섹션 목록")
    private List<Section> sections;

    @Schema(description = "섹션에 사용하지 않은 사진 목록")
    private List<Photo> unusedPhotos;

    @Getter
    @Builder
    @ToString
    @Schema(description = "앨범 섹션 정보")
    static class Section {
        @Schema(description = "섹션 ID", example = "201")
        private Long sectionId;

        @Schema(description = "섹션 이름", example = "해변에서")
        private String name;

        @Schema(description = "섹션 설명", example = "바닷가에서 찍은 사진들")
        private String description;

        @Schema(description = "섹션 시작 날짜", example = "2025-07-01")
        private LocalDate startDate;

        @Schema(description = "섹션 종료 날짜", example = "2025-07-05")
        private LocalDate endDate;

        @Schema(description = "섹션 내 사진 목록")
        private List<Photo> photos;

        static Section from(TimelineAlbumSectionDto dto) {
            return Section.builder()
                    .sectionId(dto.getSectionId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .startDate(dto.getStartDate())
                    .endDate(dto.getEndDate())
                    .photos(dto.getPhotos().stream().map(Photo::from).toList())
                    .build();
        }
    }

    @Getter
    @Builder
    @ToString
    @Schema(description = "사진 정보")
    static class Photo {
        @Schema(description = "사진 ID", example = "301")
        private Long photoId;

        @Schema(description = "사진 원본 URL", example = "https://example.com/photo/original.jpg")
        private String originalUrl;

        @Schema(description = "사진 썸네일 URL", example = "https://example.com/photo/thumbnail.jpg")
        private String thumbnailUrl;

        static Photo from(TimelineAlbumPhotoDto dto) {
            return Photo.builder()
                    .photoId(dto.getPhotoId())
                    .originalUrl(dto.getOriginalUrl())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .build();
        }
    }

    public static TimelineDetailResponse toResponse(TimelineAlbumDto dto) {
        return TimelineDetailResponse
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
                .sections(dto.getSections().stream().map(Section::from).toList())
                .unusedPhotos(dto.getUnusedPhotos().stream().map(Photo::from).toList())
                .build();
    }

}
