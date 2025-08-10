package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.application.dto.SimilarPhotoDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoOverviewResponse {

    private PagingResponse<GroupPhotoDetailResponse> allPhotos;
    private PagingResponse<GroupPhotoDetailResponse> blurryPhotos;
    private PagingResponse<GroupPhotoSimilarClusterResponse> similarPhotos;

    public static GroupPhotoOverviewResponse from(Page<GroupPhotoDto> allPhotoDtos, Page<GroupPhotoDto> blurryPhotoDtos, Page<SimilarPhotoDto> similarPhotoDtos) {
        return GroupPhotoOverviewResponse.builder()
                .allPhotos(PagingResponse.from(allPhotoDtos, GroupPhotoDetailResponse::from))
                .blurryPhotos(PagingResponse.from(blurryPhotoDtos, GroupPhotoDetailResponse::from))
                .similarPhotos(PagingResponse.from(similarPhotoDtos, GroupPhotoSimilarClusterResponse::from))
                .build();
    }

}
