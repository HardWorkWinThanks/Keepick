package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoDetailResponse {
    private Long photoId;
    private String originalUrl;
    private String thumbnailUrl;
    private String takenAt;
    private Integer width;
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
                .takenAt(dto.getTakenAt().toString())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .build();
    }
}
