package com.ssafy.keepick.photo.application.dto;

import com.ssafy.keepick.photo.domain.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class SimilarPhotoDto {

    private Long clusterId;
    private Long thumbnailPhotoId;
    private String thumbnailUrl;
    private Long photoCount;
    private List<GroupPhotoDto> photos;

    public SimilarPhotoDto(Long clusterId, Long thumbnailPhotoId, String thumbnailUrl, Long photoCount) {
        this.clusterId = clusterId;
        this.thumbnailPhotoId = thumbnailPhotoId;
        this.thumbnailUrl = thumbnailUrl;
        this.photoCount = photoCount;
    }

    public void setPhotos(List<Photo> photos) {
        this.photos = photos.stream().map(GroupPhotoDto::from).collect(Collectors.toList());
    }

}
