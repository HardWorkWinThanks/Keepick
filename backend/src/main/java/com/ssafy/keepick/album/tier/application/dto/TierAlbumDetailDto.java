package com.ssafy.keepick.album.tier.application.dto;

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
public class TierAlbumDetailDto {
    private String title;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private Integer photoCount;
    private Map<String, List<TierAlbumPhotoDto>> photos; // 티어별로 그룹화

    public static TierAlbumDetailDto from(TierAlbum tierAlbum) {
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

        // 실시간으로 photoCount 계산 (tier가 null이 아닌 사진만 카운트)
        int realTimePhotoCount = (int) allPhotos.stream()
            .filter(photo -> photo.getTier() != null)
            .count();

        return TierAlbumDetailDto.builder()
            .title(tierAlbum.getName())
            .description(tierAlbum.getDescription())
            .thumbnailUrl(tierAlbum.getThumbnailUrl())
            .originalUrl(tierAlbum.getOriginalUrl())
            .photoCount(realTimePhotoCount) // 실시간 계산된 값 사용
            .photos(completePhotosByTier)
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
