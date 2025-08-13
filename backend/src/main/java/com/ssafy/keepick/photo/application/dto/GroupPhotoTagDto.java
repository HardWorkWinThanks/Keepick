package com.ssafy.keepick.photo.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoTagDto {
    private List<String> tags;

    public static GroupPhotoTagDto from(List<String> tags) {
        return GroupPhotoTagDto.builder().tags(tags).build();
    }
}
