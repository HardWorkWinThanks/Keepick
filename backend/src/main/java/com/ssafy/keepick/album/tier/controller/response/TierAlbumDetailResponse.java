package com.ssafy.keepick.album.tier.controller.response;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ssafy.keepick.album.tier.domain.TierAlbum;
import com.ssafy.keepick.album.tier.domain.TierAlbumPhoto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TierAlbumDetailResponse {
    private String title;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private Integer photoCount;
    private Map<String, List<TierAlbumPhotoDto>> photos; // 티어별로 그룹화

    public static TierAlbumDetailResponse from(TierAlbum tierAlbum) {
        // 모든 사진을 가져와서 DTO에서 티어별로 그룹화
        List<TierAlbumPhoto> allPhotos = tierAlbum.getAllPhotos();
        
        Map<String, List<TierAlbumPhotoDto>> photosByTier = allPhotos.stream()
            .filter(photo -> photo.getTier() != null) // 포함된 사진만 (tier != null)
            .collect(Collectors.groupingBy(
                photo -> photo.getTier().name(), // Tier enum을 String으로 변환
                Collectors.mapping(
                    TierAlbumPhotoDto::from,
                    Collectors.toList()
                )
            ));

        return TierAlbumDetailResponse.builder()
            .title(tierAlbum.getName())
            .description(tierAlbum.getDescription())
            .thumbnailUrl(tierAlbum.getThumbnailUrl())
            .originalUrl(tierAlbum.getOriginalUrl())
            .photoCount(tierAlbum.getPhotoCount())
            .photos(photosByTier)
            .build();
    }

    @Getter
    @Builder
    public static class TierAlbumPhotoDto {
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
    }
}
