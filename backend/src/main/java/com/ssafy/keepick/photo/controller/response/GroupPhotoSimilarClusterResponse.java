package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoSimilarClusterResponse {

    @Schema(description = "유사한 사진 묶음 ID", example = "101")
    private Long clusterId;

    @Schema(description = "유사한 사진 묶음의 대표 사진 ID", example = "1")
    private Long thumbnailPhotoId;

    @Schema(description = "유사한 사진 묶음의 대표 사진 썸네일버전 URL", example = "http://thumbnail.com")
    private String thumbnailUrl;

    @Schema(description = "유사한 사진 묶음에 포함된 사진 개수", example = "5")
    private Long photoCount;

    @Schema(description = "유사한 사진 묶음에 포함된 사진 정보 목록")
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
