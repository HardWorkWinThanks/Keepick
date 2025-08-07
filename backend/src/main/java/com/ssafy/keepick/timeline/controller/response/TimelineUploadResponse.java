package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimelineUploadResponse {

    private Long photoId;
    private String originalUrl;
    private String thumbnailUrl;

    public static TimelineUploadResponse toResponse(TimelineAlbumPhotoDto dto) {
        return TimelineUploadResponse
                .builder()
                .photoId(dto.getPhotoId())
                .originalUrl(dto.getOriginalUrl())
                .thumbnailUrl(dto.getThumbnailUrl())
                .build();
    }

}
