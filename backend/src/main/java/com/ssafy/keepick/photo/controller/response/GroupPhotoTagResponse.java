package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.PhotoTagDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoTagResponse {

    private List<String> tags;
    private List<String> memberNames;

    public static GroupPhotoTagResponse from(PhotoTagDto dto) {
        return GroupPhotoTagResponse.builder()
                .tags(dto.getTags())
                .memberNames(dto.getMemberNames())
                .build();
    }
}
