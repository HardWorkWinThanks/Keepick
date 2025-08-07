package com.ssafy.keepick.timeline.application.dto;

import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.timeline.domain.TimelineAlbum;
import com.ssafy.keepick.timeline.domain.TimelineAlbumPhoto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimelineAlbumPhotoDto {

    private Long albumPhotoId;
    private Long sectionId;
    private Long albumId;
    private Long photoId;
    private Integer sequence;
    private String originalUrl;
    private String thumbnailUrl;

    public static TimelineAlbumPhotoDto from(TimelineAlbumPhoto timelineSectionPhoto) {
        return TimelineAlbumPhotoDto
                .builder()
                .albumPhotoId(timelineSectionPhoto.getId())
                .sectionId(timelineSectionPhoto.getSection() != null ? timelineSectionPhoto.getSection().getId() : null)
                .albumId(timelineSectionPhoto.getAlbum().getId())
                .photoId(timelineSectionPhoto.getPhoto().getId())
                .sequence(timelineSectionPhoto.getSequence())
                .originalUrl(timelineSectionPhoto.getPhoto().getOriginalUrl())
                .thumbnailUrl(timelineSectionPhoto.getPhoto().getThumbnailUrl())
                .build();
    }

    public static TimelineAlbumPhotoDto of(TimelineAlbum album, Photo photo) {
        return TimelineAlbumPhotoDto
                .builder()
                .albumId(album.getId())
                .photoId(photo.getId())
                .build();
    }

}
