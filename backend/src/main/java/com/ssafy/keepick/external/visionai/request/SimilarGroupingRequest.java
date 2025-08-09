package com.ssafy.keepick.external.visionai.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class SimilarGroupingRequest {
    List<ImageRequest> images;
    private Float similarityThreshold;
}
