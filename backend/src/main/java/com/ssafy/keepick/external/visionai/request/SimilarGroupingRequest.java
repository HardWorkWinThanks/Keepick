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
public class SimilarGroupingRequest {
    List<ImageRequest> images;
    private Float similarityThreshold;

    public static SimilarGroupingRequest from(List<Photo> photos) {
        return SimilarGroupingRequest.builder()
                .images(photos.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .similarityThreshold(0.9F)
                .build();
    }
}
