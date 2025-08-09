package com.ssafy.keepick.external.visionai.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.ssafy.keepick.photo.domain.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BlurDetectionRequest {
    private List<ImageRequest> images;
    private Float blurThreshold;

    public static BlurDetectionRequest from(List<Photo> photos) {
        return BlurDetectionRequest.builder()
                .images(photos.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .blurThreshold(50F)
                .build();
    }
}
