package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.photo.domain.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoOverviewDto {

    private Page<GroupPhotoDto> allPhotos;
    private Page<GroupPhotoDto> blurredPhotos;
    private Page<PhotoClusterDto> similarPhotos;

    public static GroupPhotoOverviewDto from(Page<Photo> allPhotos, Page<Photo> blurredPhotos, Page<PhotoClusterDto> similarPhotos) {
        return GroupPhotoOverviewDto.builder()
                .allPhotos(allPhotos.map(GroupPhotoDto::from))
                .blurredPhotos(blurredPhotos.map(GroupPhotoDto::from))
                .similarPhotos(similarPhotos)
                .build();
    }

}
