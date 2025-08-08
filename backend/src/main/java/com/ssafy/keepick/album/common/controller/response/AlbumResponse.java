package com.ssafy.keepick.album.common.controller.response;

import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AlbumResponse {

    private List<Album> timelineAlbumList;
    private List<Album> tierAlbumList;
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
    static class Album {
        private Long albumId;
        private String name;
        private String description;
        private String thumbnailUrl;
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
