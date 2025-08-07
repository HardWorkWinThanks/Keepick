package com.ssafy.keepick.highlight.application.dto;

import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
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
public class HighlightAlbumDto {
    private Long albumId;
    private Long groupId;
    private String name;
    private String description;
    private int photoCount;
    private String thumbnailUrl;
    private Map<HighlightType, List<HighlightAlbumPhotoDto>> photos;

    public static HighlightAlbumDto from(HighlightAlbum album) {
        return HighlightAlbumDto.builder()
                .albumId(album.getId())
                .groupId(album.getGroup().getId())
                .name(album.getName())
                .description(album.getDescription())
                .photoCount(album.getPhotoCount())
                .thumbnailUrl(album.getThumbnailUrl())
                .photos(groupingByType(album.getPhotos()))
                .build();
    }

    private static Map<HighlightType, List<HighlightAlbumPhotoDto>> groupingByType(List<HighlightAlbumPhoto> photoList) {
        return photoList.stream()
                .collect(Collectors.groupingBy(
                    HighlightAlbumPhoto::getType,
                    Collectors.mapping(HighlightAlbumPhotoDto::from, Collectors.toList())
                ));
        }

}
