package com.ssafy.keepick.external.visionai.request;

import com.ssafy.keepick.photo.domain.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ImageRequest {
    private String url;
    private String name;

    public static ImageRequest from(Photo photo) {
        return ImageRequest.builder()
                .name(photo.getId().toString())
                .url(photo.getOriginalUrl())
                .build();
    }
}
