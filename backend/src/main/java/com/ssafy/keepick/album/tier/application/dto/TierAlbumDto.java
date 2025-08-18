package com.ssafy.keepick.album.tier.application.dto;

import java.time.LocalDateTime;

import com.ssafy.keepick.album.tier.domain.TierAlbum;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TierAlbumDto {
    private Long id;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String originalUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer photoCount;


    public static TierAlbumDto from(TierAlbum tierAlbum) {
        return TierAlbumDto.builder()
                .id(tierAlbum.getId())
                .name(tierAlbum.getName())
                .description(tierAlbum.getDescription())
                .thumbnailUrl(tierAlbum.getThumbnailUrl())
                .originalUrl(tierAlbum.getOriginalUrl())
                .createdAt(tierAlbum.getCreatedAt())
                .updatedAt(tierAlbum.getUpdatedAt())
                .photoCount(tierAlbum.getPhotoCount())
                .build();
    }
}
