package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.photo.application.dto.GroupPhotoOverviewDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoOverviewResponse {

    private PagingResponse<GroupPhotoDetailResponse> allPhotos;
    private PagingResponse<GroupPhotoDetailResponse> blurryPhotos;
    private PagingResponse<GroupPhotoSimilarClusterResponse> similarPhotos;

    public static GroupPhotoOverviewResponse from(GroupPhotoOverviewDto dto) {
        return GroupPhotoOverviewResponse.builder()
                .allPhotos(PagingResponse.from(dto.getAllPhotos(), GroupPhotoDetailResponse::from))
                .blurryPhotos(PagingResponse.from(dto.getBlurryPhotos(), GroupPhotoDetailResponse::from))
                .similarPhotos(PagingResponse.from(dto.getSimilarPhotos(), GroupPhotoSimilarClusterResponse::from))
                .build();
    }

}
