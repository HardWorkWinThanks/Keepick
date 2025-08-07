package com.ssafy.keepick.highlight.application.dto;

import com.ssafy.keepick.highlight.domain.HighlightAlbum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
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
    private List<HighlightAlbumPhotoDto> photos;

    public static HighlightAlbumDto from(HighlightAlbum album) {
        return HighlightAlbumDto.builder()
                .albumId(album.getId())
                .groupId(album.getGroup().getId())
                .name(album.getName())
                .description(album.getDescription())
                .photoCount(album.getPhotoCount())
                .photos(album.getPhotos().stream()
                        .map(HighlightAlbumPhotoDto::from)
                        .collect(Collectors.toList()))
                .build();
    }

}
