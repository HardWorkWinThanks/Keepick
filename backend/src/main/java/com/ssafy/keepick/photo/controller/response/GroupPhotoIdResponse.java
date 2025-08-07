package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoIdResponse {
    Long groupId;

    public static List<GroupPhotoIdResponse> from(List<GroupPhotoDto> dtoList) {
        return dtoList.stream().map(dto -> GroupPhotoIdResponse.builder()
                .groupId(dto.getPhotoId())
                .build())
            .collect(Collectors.toList());
    }
}
