package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TimelineUploadResponse {

    private Long albumId;
    private List<Long> uploadedPhotoIds;

    public static TimelineUploadResponse toResponse(Long albumId, List<TimelineAlbumPhotoDto> dtos) {
        return TimelineUploadResponse
                .builder()
                .albumId(albumId)
                .uploadedPhotoIds(dtos.stream().map(TimelineAlbumPhotoDto::getPhotoId).toList())
                .build();
    }

}
