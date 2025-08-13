package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoTagDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoAllTagResponse {
    private List<String> tags;

    public static GroupPhotoAllTagResponse from(GroupPhotoTagDto tags) {
        return GroupPhotoAllTagResponse.builder()
                .tags(tags.getTags().stream().map(String::toString).toList())
                .build();
    }
}
