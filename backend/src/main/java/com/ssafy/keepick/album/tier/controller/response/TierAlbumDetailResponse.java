package com.ssafy.keepick.album.tier.controller.response;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
        
        // 모든 등급에 대해 빈 배열로 초기화
        Map<String, List<TierAlbumPhotoDto>> completePhotosByTier = new LinkedHashMap<>();
        completePhotosByTier.put("S", new ArrayList<>());
        completePhotosByTier.put("A", new ArrayList<>());
        completePhotosByTier.put("B", new ArrayList<>());
        completePhotosByTier.put("C", new ArrayList<>());
        completePhotosByTier.put("D", new ArrayList<>());
        completePhotosByTier.put("UNASSIGNED", new ArrayList<>());
        
        // 각 사진을 해당 등급에 추가
        for (TierAlbumPhoto photo : allPhotos) {
            TierAlbumPhotoDto photoDto = TierAlbumPhotoDto.from(photo);
            
            if (photo.getTier() != null) {
                // 등급이 설정된 사진
                String tierName = photo.getTier().name();
                completePhotosByTier.get(tierName).add(photoDto);
            } else {
                // 등급이 설정되지 않은 사진 (UNASSIGNED)
                completePhotosByTier.get("UNASSIGNED").add(photoDto);
            }
        }

        return TierAlbumDetailResponse.builder()
            .title(tierAlbum.getName())
            .description(tierAlbum.getDescription())
            .thumbnailUrl(tierAlbum.getThumbnailUrl())
            .originalUrl(tierAlbum.getOriginalUrl())
            .photoCount(tierAlbum.getPhotoCount())
            .photos(completePhotosByTier)
            .build();
    }

    // 생성 시 사용하는 메서드 (티어가 아직 설정되지 않은 상태)
    public static TierAlbumDetailResponse fromForCreation(TierAlbum tierAlbum) {
        // 모든 등급에 대해 빈 배열로 초기화
        Map<String, List<TierAlbumPhotoDto>> emptyPhotosByTier = new LinkedHashMap<>();
        emptyPhotosByTier.put("S", new ArrayList<>());
        emptyPhotosByTier.put("A", new ArrayList<>());
        emptyPhotosByTier.put("B", new ArrayList<>());
        emptyPhotosByTier.put("C", new ArrayList<>());
        emptyPhotosByTier.put("D", new ArrayList<>());
        emptyPhotosByTier.put("UNASSIGNED", new ArrayList<>());
        
        return TierAlbumDetailResponse.builder()
            .title(tierAlbum.getName())
            .description(tierAlbum.getDescription())
            .thumbnailUrl(tierAlbum.getThumbnailUrl())
            .originalUrl(tierAlbum.getOriginalUrl())
            .photoCount(tierAlbum.getPhotoCount())
            .photos(emptyPhotosByTier)
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
