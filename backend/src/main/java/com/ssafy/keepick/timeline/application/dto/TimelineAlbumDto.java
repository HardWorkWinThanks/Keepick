package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineSection;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TimelineAlbumDto {

    private Long timelineAlbumId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer photoCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TimelineSectionDto> sections;

    public static TimelineAlbumDto from(TimelineAlbum album) {
        return TimelineAlbumDto.builder()
                .timelineAlbumId(album.getId())
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

    public static TimelineAlbumDto from(TimelineAlbum album, List<TimelineSection> sections) {
        TimelineAlbumDto dto = TimelineAlbumDto.from(album);
        dto.setSections(sections);
        return dto;
    }

    private void setSections(List<TimelineSection> sections) {
        this.sections = sections.stream().map(TimelineSectionDto::from).toList();
    }

}
