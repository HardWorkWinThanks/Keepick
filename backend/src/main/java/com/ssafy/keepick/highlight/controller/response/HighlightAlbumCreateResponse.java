package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumCreateResponse {

    private Long albumId;
    private Long groupId;
    private String name;
    private String description;
    private int photoCount;
    private List<HighlightScreenshotSaveResponse> photos;

    public static HighlightAlbumCreateResponse from(HighlightAlbumDto album) {
        return HighlightAlbumCreateResponse.builder()
                .albumId(album.getAlbumId())
                .groupId(album.getGroupId())
                .name(album.getName())
                .description(album.getDescription())
                .photoCount(album.getPhotoCount())
                .photos(album.getPhotos().stream()
                        .map(HighlightScreenshotSaveResponse::from)
                        .collect(Collectors.toList()))
                .build();
    }
}
