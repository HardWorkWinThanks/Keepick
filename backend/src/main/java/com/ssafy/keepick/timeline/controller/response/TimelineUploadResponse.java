package com.ssafy.keepick.timeline.controller.response;

import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimelineUploadResponse {

    @Schema(description = "업로드된 사진 ID", example = "301")
    private Long photoId;

    @Schema(description = "사진 원본 URL", example = "https://example.com/photo/original.jpg")
    private String originalUrl;

    @Schema(description = "사진 썸네일 URL", example = "https://example.com/photo/thumbnail.jpg")
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
