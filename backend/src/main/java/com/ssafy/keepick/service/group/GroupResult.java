package com.ssafy.keepick.service.group;

import com.ssafy.keepick.entity.Group;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class GroupResult {

    @Builder
    @Getter
    public static class GroupInfo {
        private Long groupId;
        private String name;
        private String description;
        private String thumbnailUrl;
        private Integer memberCount;
        private Long creatorId;
        private String creatorName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static GroupResult.GroupInfo from(Group group) {
            return GroupInfo
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

}
