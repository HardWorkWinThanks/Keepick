package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineSectionDto;
import com.ssafy.keepick.timeline.application.dto.TimelineSectionPhotoDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class TimelineDetailResponse {

    private Long albumId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<Section> sections;

    @Getter
    @Builder
    static class Section {
        private Long sectionId;
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<Photo> photos;

        static Section of(TimelineSectionDto dto) {
            return Section.builder()
                    .sectionId(dto.getTimelineSectionId())
                    .name(dto.getName())
                    .description(dto.getDescription())
                    .startDate(dto.getStartDate())
                    .endDate(dto.getEndDate())
                    .photos(dto.getPhotos().stream().map(Photo::of).toList())
                    .build();
        }
    }

    @Getter
    @Builder
    static class Photo {
        private Long photoId;
        private String originalUrl;
        private String thumbnailUrl;

        static Photo of(TimelineSectionPhotoDto dto) {
            return Photo
                    .builder()
                    .photoId(dto.getPhotoId())
                    .originalUrl(dto.getOriginalUrl())
                    .thumbnailUrl(dto.getThumbnailUrl())
                    .build();
        }

    }

    public static TimelineDetailResponse toResponse(TimelineAlbumDto dto) {
        return TimelineDetailResponse
                .builder()
                .albumId(dto.getTimelineAlbumId())
                .name(dto.getName())
                .description(dto.getDescription())
                .thumbnailUrl(dto.getThumbnailUrl())
                .originalUrl(dto.getOriginalUrl())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .sections(dto.getSections().stream().map(Section::of).toList())
                .build();
    }

}
