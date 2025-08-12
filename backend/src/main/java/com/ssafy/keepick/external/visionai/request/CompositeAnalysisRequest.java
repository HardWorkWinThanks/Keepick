package com.ssafy.keepick.external.visionai.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.ssafy.keepick.member.domain.Member;
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
public class CompositeAnalysisRequest {
    List<ImageRequest> targetFaces;
    List<ImageRequest> sourceImages;
    private boolean returnTaggedImages;
    private String jobId;

    public static CompositeAnalysisRequest from(String jobId, List<Member> members, List<Photo> photos) {
        return CompositeAnalysisRequest.builder()
                .jobId(jobId)
                .targetFaces(members.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .sourceImages(photos.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .returnTaggedImages(false)
                .build();
    }
}
