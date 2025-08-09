package com.ssafy.keepick.external.visionai.request;

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
public class FaceTaggingRequest {
    List<ImageRequest> targetFaces;
    List<ImageRequest> sourceFaces;
    private Float distanceThreshold;
    private boolean returnTaggedImages;

    public static FaceTaggingRequest from(List<Member> members, List<Photo> photos) {
        return FaceTaggingRequest.builder()
                .targetFaces(members.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .sourceFaces(photos.stream().map(ImageRequest::from).collect(Collectors.toList()))
                .distanceThreshold(0.6F)
                .returnTaggedImages(true)
                .build();
    }
}
