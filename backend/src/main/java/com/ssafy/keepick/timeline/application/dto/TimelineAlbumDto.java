package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TimelineAlbumDto {

    private Long albumId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer photoCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TimelineAlbumSectionDto> sections;
    private List<TimelineAlbumPhotoDto> unusedPhotos;

    public static TimelineAlbumDto from(TimelineAlbum album) {
        return TimelineAlbumDto.builder()
                .albumId(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .thumbnailUrl(album.getThumbnailUrl())
                .originalUrl(album.getOriginalUrl())
                .startDate(album.getStartDate())
                .endDate(album.getEndDate())
                .photoCount(album.getPhotoCount())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .build();
    }

    public static TimelineAlbumDto fromDetail(TimelineAlbum album) {
        return TimelineAlbumDto.builder()
                .albumId(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .thumbnailUrl(album.getThumbnailUrl())
                .originalUrl(album.getOriginalUrl())
                .startDate(album.getStartDate())
                .endDate(album.getEndDate())
                .photoCount(album.getPhotoCount())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .sections(album.getSections().stream().map(TimelineAlbumSectionDto::fromDetail).toList())
                .unusedPhotos(album.getPhotos().stream().map(TimelineAlbumPhotoDto::from).toList())
                .build();
    }

}
