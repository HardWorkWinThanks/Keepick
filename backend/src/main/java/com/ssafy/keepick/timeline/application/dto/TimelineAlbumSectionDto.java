package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelineAlbumSection;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class TimelineAlbumSectionDto {

    private Long sectionId;
    private Long albumId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private Integer sequence;
    private List<TimelineAlbumPhotoDto> photos;

    public static TimelineAlbumSectionDto from(TimelineAlbumSection timelineSection) {
        return TimelineAlbumSectionDto.builder()
                .sectionId(timelineSection.getId())
                .albumId(timelineSection.getAlbum().getId())
                .name(timelineSection.getName())
                .startDate(timelineSection.getStartDate())
                .endDate(timelineSection.getEndDate())
                .description(timelineSection.getDescription())
                .sequence(timelineSection.getSequence())
                .build();
    }

    public static TimelineAlbumSectionDto fromDetail(TimelineAlbumSection timelineSection) {
        return TimelineAlbumSectionDto.builder()
                .sectionId(timelineSection.getId())
                .albumId(timelineSection.getAlbum().getId())
                .name(timelineSection.getName())
                .startDate(timelineSection.getStartDate())
                .endDate(timelineSection.getEndDate())
                .description(timelineSection.getDescription())
                .sequence(timelineSection.getSequence())
                .photos(timelineSection.getPhotos().stream().map(TimelineAlbumPhotoDto::from).toList())
                .build();
    }

}
