package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumSummaryResponse {
    @Schema(description = "하이라이트 앨범 목록")
    List<Info> highlightAlbums;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Info {
        @Schema(description = "하이라이트 앨범 ID", example = "101")
        private Long id;

        @Schema(description = "하이라이트 앨범 이름", example = "2025.08.01 그룹챗 하이라이트")
        private String name;

        @Schema(description = "하이라이트 앨범 설명", example = "제주도 여행 앨범 만들면서 진행한 그룹챗의 앨범", nullable = true)
        private String description;

        @Schema(description = "하이라이트 앨범 썸네일 URL (앨범 생성 시점에 전달된 스크린샷 중 하나로 정함)", example = "http://highlight.com")
        private String thumbnailUrl;

        public static Info from(HighlightAlbumDto dto) {
            return Info.builder()
                    .id(dto.getAlbumId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .build();
        }
    }

    public static HighlightAlbumSummaryResponse from(List<HighlightAlbumDto> dto) {
        return HighlightAlbumSummaryResponse.builder()
                .highlightAlbums(dto.stream().map(Info::from).toList())
                .build();
    }
}
