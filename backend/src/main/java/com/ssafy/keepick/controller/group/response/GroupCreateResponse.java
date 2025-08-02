package com.ssafy.keepick.controller.group.response;

import com.ssafy.keepick.service.group.dto.GroupDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupCreateResponse {

    private Long groupId;
    private String name;
    private LocalDateTime createdAt;

    public static GroupCreateResponse toResponse(GroupDto dto) {
        return GroupCreateResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getName())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
