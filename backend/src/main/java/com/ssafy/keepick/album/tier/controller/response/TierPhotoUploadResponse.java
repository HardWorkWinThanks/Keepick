package com.ssafy.keepick.album.tier.controller.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TierPhotoUploadResponse {

    private List<Photo> photos;

    @Getter
    @Builder
    public static class Photo {
        private Long photoId;
        private String originalUrl;
        private String thumbnailUrl;
    }
}
