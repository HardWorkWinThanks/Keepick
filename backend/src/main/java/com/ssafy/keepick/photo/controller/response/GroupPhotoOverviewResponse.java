package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.photo.application.dto.GroupPhotoOverviewDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoOverviewResponse {

    @Schema(description = "그룹 전체 사진 목록 (페이징 적용하여 요청받은 size만큼 반환)")
    private PagingResponse<GroupPhotoDetailResponse> allPhotos;

    @Schema(description = "그룹 내 흐린 사진 목록 (페이징 적용하여 요청받은 size만큼 반환)")
    private PagingResponse<GroupPhotoDetailResponse> blurryPhotos;

    @Schema(description = "그룹 내 유사한 사진 묶음 목록 (페이징 적용하여 요청받은 size만큼 반환)")
    private PagingResponse<GroupPhotoSimilarClusterResponse> similarPhotos;

    public static GroupPhotoOverviewResponse from(GroupPhotoOverviewDto dto) {
        return GroupPhotoOverviewResponse.builder()
                .allPhotos(PagingResponse.from(dto.getAllPhotos(), GroupPhotoDetailResponse::from))
                .blurryPhotos(PagingResponse.from(dto.getBlurryPhotos(), GroupPhotoDetailResponse::from))
                .similarPhotos(PagingResponse.from(dto.getSimilarPhotos(), GroupPhotoSimilarClusterResponse::from))
                .build();
    }

}
