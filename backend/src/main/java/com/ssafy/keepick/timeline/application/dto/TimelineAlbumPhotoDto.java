package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimelineAlbumPhotoDto {

    private Long albumPhotoId;
    private Long sectionId;
    private Long photoId;
    private Integer sequence;
    private String originalUrl;
    private String thumbnailUrl;

    public static TimelineAlbumPhotoDto from(TimelineAlbumPhoto timelineSectionPhoto) {
        return TimelineAlbumPhotoDto
                .builder()
                .albumPhotoId(timelineSectionPhoto.getId())
                .sectionId(timelineSectionPhoto.getSection() != null ? timelineSectionPhoto.getSection().getId() : null)
                .photoId(timelineSectionPhoto.getPhoto().getId())
                .sequence(timelineSectionPhoto.getSequence())
                .originalUrl(timelineSectionPhoto.getPhoto().getOriginalUrl())
                .thumbnailUrl(timelineSectionPhoto.getPhoto().getThumbnailUrl())
                .build();
    }

}
