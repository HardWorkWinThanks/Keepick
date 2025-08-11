package com.ssafy.keepick.album.tier.application.dto;

import com.ssafy.keepick.album.tier.controller.response.TierPhotoUploadResponse;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class TierAlbumPhotoDto {
    private Long photoId;
    private String thumbnailUrl;
    private String originalUrl;
    private Integer sequence;

    public static TierAlbumPhotoDto from(TierAlbumPhoto tierAlbumPhoto) {
        return TierAlbumPhotoDto.builder()
            .photoId(tierAlbumPhoto.getPhoto().getId())
            .thumbnailUrl(tierAlbumPhoto.getPhoto().getThumbnailUrl())
            .originalUrl(tierAlbumPhoto.getPhoto().getOriginalUrl())
            .sequence(tierAlbumPhoto.getSequence())
            .build();
    }

    public TierPhotoUploadResponse.Photo toResponse() {
        return TierPhotoUploadResponse.Photo.builder()
                .photoId(this.photoId)
                .originalUrl(this.originalUrl)
                .thumbnailUrl(this.thumbnailUrl)
                .build();
    }

    public static TierPhotoUploadResponse toResponse(List<TierAlbumPhotoDto> dtos) {
        List<TierPhotoUploadResponse.Photo> photos = dtos.stream()
                .map(TierAlbumPhotoDto::toResponse)
                .collect(Collectors.toList());
        
        return TierPhotoUploadResponse.builder()
                .photos(photos)
                .build();
    }
}
