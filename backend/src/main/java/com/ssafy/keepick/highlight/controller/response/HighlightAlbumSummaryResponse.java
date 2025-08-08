package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumSummaryResponse {
    List<Info> highlightAlbums;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Info {
        private Long id;

        private String name;

        private String description;

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
