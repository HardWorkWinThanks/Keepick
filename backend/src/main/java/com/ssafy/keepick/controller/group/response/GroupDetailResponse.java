package com.ssafy.keepick.controller.group.response;

import com.ssafy.keepick.service.group.dto.GroupDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupDetailResponse {
    private Long groupId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private Integer memberCount;
    private Long creatorId;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupDetailResponse toResponse(GroupDto dto) {
        return GroupDetailResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getName())
                .description(dto.getDescription())
                .thumbnailUrl(dto.getThumbnailUrl())
                .memberCount(dto.getMemberCount())
                .creatorId(dto.getCreatorId())
                .creatorName(dto.getCreatorName())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
