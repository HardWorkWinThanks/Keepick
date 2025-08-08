package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import com.ssafy.keepick.highlight.domain.HighlightType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumResponse {

    private Long albumId;
    private Long groupId;
    private String name;
    private String description;
    private int photoCount;
    private Map<HighlightType, List<HighlightScreenshotSaveResponse>> photos;

    public static HighlightAlbumResponse from(HighlightAlbumDto album) {
        return HighlightAlbumResponse.builder()
                .albumId(album.getAlbumId())
                .groupId(album.getGroupId())
                .name(album.getName())
                .description(album.getDescription())
                .photoCount(album.getPhotoCount())
                .photos(groupingByType(album.getPhotos()))
                .build();
    }

    private static Map<HighlightType, List<HighlightScreenshotSaveResponse>> groupingByType(Map<HighlightType, List<HighlightAlbumPhotoDto>> photoList) {
        return photoList.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> entry.getValue().stream()
                            .map(HighlightScreenshotSaveResponse::from)
                            .collect(Collectors.toList())
                ));
    }
}
