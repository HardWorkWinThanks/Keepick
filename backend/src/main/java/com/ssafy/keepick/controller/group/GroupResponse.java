package com.ssafy.keepick.controller.group;

import com.ssafy.keepick.service.group.GroupResult;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class GroupResponse {

    @Builder
    @Getter
    public static class Creation {
        private Long groupId;
        private String name;
        private Integer memberCount;
        private LocalDateTime createdAt;

        public static Creation from(GroupResult.GroupInfo result) {
            return Creation
                    .builder()
                    .groupId(result.getGroupId())
                    .name(result.getName())
                    .memberCount(result.getMemberCount())
                    .createdAt(result.getCreatedAt())
                    .build();
        }
    }

    @Builder
    @Getter
    public static class MyGroup {
        private Long groupId;
        private String name;
        private Integer memberCount;
        private Long invitationId;
        private String invitationStatus;

        public static MyGroup from(GroupResult.GroupMemberInfo result) {
            return MyGroup
                    .builder()
                    .groupId(result.getGroupId())
                    .name(result.getGroupName())
                    .memberCount(result.getMemberCount())
                    .invitationId(result.getGroupMemberId())
                    .invitationStatus(result.getStatus())
                    .build();
        }
    }

}
