package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelinePhoto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimelinePhotoDto {

    private Long timelineSectionPhotoId;
    private Long timelineSectionId;
    private Long photoId;
    private Integer sequence;
    private String originalUrl;
    private String thumbnailUrl;

    public static TimelinePhotoDto from(TimelinePhoto timelineSectionPhoto) {
        return TimelinePhotoDto
                .builder()
                .timelineSectionPhotoId(timelineSectionPhoto.getId())
                .timelineSectionId(timelineSectionPhoto.getSection().getId())
                .photoId(timelineSectionPhoto.getPhoto().getId())
                .sequence(timelineSectionPhoto.getSequence())
                .originalUrl(timelineSectionPhoto.getPhoto().getOriginalUrl())
                .thumbnailUrl(timelineSectionPhoto.getPhoto().getThumbnailUrl())
                .build();
    }

}
