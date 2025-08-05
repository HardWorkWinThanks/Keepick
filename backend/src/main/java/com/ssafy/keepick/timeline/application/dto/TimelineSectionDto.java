package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelineSection;
import com.ssafy.keepick.timeline.domain.TimelineSectionPhoto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class TimelineSectionDto {

    private Long timelineSectionId;
    private Long timelineAlbumId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private Integer sequence;
    private List<TimelineSectionPhotoDto> photos;

    public static TimelineSectionDto from(TimelineSection timelineSection) {
        return TimelineSectionDto.builder()
                .timelineSectionId(timelineSection.getId())
                .timelineAlbumId(timelineSection.getAlbum().getId())
                .name(timelineSection.getName())
                .startDate(timelineSection.getStartDate())
                .endDate(timelineSection.getEndDate())
                .description(timelineSection.getDescription())
                .sequence(timelineSection.getSequence())
                .build();
    }

    public static TimelineSectionDto from(TimelineSection timelineSection, List<TimelineSectionPhoto> photos) {
        TimelineSectionDto dto = TimelineSectionDto.from(timelineSection);
        dto.setPhotos(photos);
        return dto;
    }

    private void setPhotos(List<TimelineSectionPhoto> photos) {
        this.photos = photos.stream().map(TimelineSectionPhotoDto::from).toList();
    }

}
