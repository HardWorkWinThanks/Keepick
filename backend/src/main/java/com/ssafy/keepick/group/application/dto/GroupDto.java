package com.ssafy.keepick.group.application.dto;

import com.ssafy.keepick.group.domain.Group;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupDto {

    private Long groupId;
    private String name;
    private String description;
    private String thumbnailUrl;
    private Integer memberCount;
    private Long creatorId;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupDto from(Group group) {
        return GroupDto
                .builder()
                .groupId(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .thumbnailUrl(group.getGroupThumbnailUrl())
                .memberCount(group.getMemberCount())
                .creatorId(group.getCreator().getId())
                .creatorName(group.getCreator().getName())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
