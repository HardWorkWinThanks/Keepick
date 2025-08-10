package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoSimilarClusterResponse {

    private Long clusterId;
    private Long thumbnailPhotoId;
    private String thumbnailUrl;
    private Long photoCount;
    private List<GroupPhotoDetailResponse> photos;

    public static GroupPhotoSimilarClusterResponse from(PhotoClusterDto dto) {
        return GroupPhotoSimilarClusterResponse.builder()
                .clusterId(dto.getClusterId())
                .thumbnailPhotoId(dto.getThumbnailPhotoId())
                .thumbnailUrl(dto.getThumbnailUrl())
                .photoCount(dto.getPhotoCount())
                .photos(GroupPhotoDetailResponse.from(dto.getPhotos()))
                .build();
    }

}
