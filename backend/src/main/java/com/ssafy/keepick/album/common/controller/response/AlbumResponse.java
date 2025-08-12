package com.ssafy.keepick.album.common.controller.response;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AlbumResponse {

    @Schema(description = "타임라인 앨범 목록")
    private List<Album> timelineAlbumList;

    @Schema(description = "티어 앨범 목록")
    private List<Album> tierAlbumList;

    @Schema(description = "하이라이트 앨범 목록")
    private List<Album> highlightAlbumList;

    public static AlbumResponse from(AlbumDto dto) {
        return AlbumResponse.builder()
                .timelineAlbumList(dto.getTimelineAlbumDtoList().stream().map(Album::from).toList())
                .tierAlbumList(dto.getTierAlbumDtoList().stream().map(Album::from).toList())
                .highlightAlbumList(dto.getHighlightAlbumDtoList().stream().map(Album::from).toList())
                .build();
    }

    @Getter
    @Builder
    @Schema(description = "앨범 정보")
    static class Album {

        @Schema(description = "앨범 ID", example = "101")
        private Long albumId;

        @Schema(description = "앨범 이름", example = "여름 여행")
        private String name;

        @Schema(description = "앨범 설명", example = "2025년 여름 바다 여행 기록", nullable = true)
        private String description;

        @Schema(description = "앨범 대표 사진 썸네일 URL", example = "https://example.com/thumbnail.jpg")
        private String thumbnailUrl;

        @Schema(description = "앨범 내 사진 개수", example = "20")
        private Integer photoCount;

        public static Album from(TimelineAlbumDto dto) {
            return Album.builder()
                    .albumId(dto.getAlbumId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .photoCount(dto.getPhotoCount())
                    .build();
        }

        public static Album from(TierAlbumDto dto) {
            return Album.builder()
                    .albumId(dto.getId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .photoCount(dto.getPhotoCount())
                    .build();
        }

        public static Album from(HighlightAlbumDto dto) {
            return Album.builder()
                    .albumId(dto.getAlbumId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .photoCount(dto.getPhotoCount())
                    .build();
        }


    }


}
