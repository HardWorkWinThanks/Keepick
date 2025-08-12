package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Optional;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoDetailResponse {

    @Schema(description = "사진 ID", example = "101")
    private Long photoId;

    @Schema(description = "사진 원본 URL", example = "https://example.com/images/photo.jpg")
    private String originalUrl;

    @Schema(description = "사진 썸네일 URL", example = "https://example.com/images/photo_thumbnail.jpg")
    private String thumbnailUrl;

    @Schema(description = "사진 촬영일시", example = "2025-08-11T12:34:56")
    private String takenAt;

    @Schema(description = "사진 가로 해상도(px)", example = "1920")
    private Integer width;

    @Schema(description = "사진 세로 해상도(px)", example = "1080")
    private Integer height;


    public static List<GroupPhotoDetailResponse> from (List<GroupPhotoDto> dtoList) {
        return dtoList.stream()
                .map(GroupPhotoDetailResponse::from)
                .toList();
    }

    public static GroupPhotoDetailResponse from (GroupPhotoDto dto) {
        return GroupPhotoDetailResponse.builder()
                .photoId(dto.getPhotoId())
                .originalUrl(dto.getOriginalUrl())
                .thumbnailUrl(dto.getThumbnailUrl())
                .takenAt(Optional.ofNullable(dto.getTakenAt())
                        .map(Object::toString)
                        .orElse(null))
                .width(dto.getWidth())
                .height(dto.getHeight())
                .build();
    }
}
