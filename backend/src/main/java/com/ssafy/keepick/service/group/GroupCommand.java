package com.ssafy.keepick.service.group;

import com.ssafy.keepick.entity.GroupMemberStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class GroupCommand {

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Create {
        private Long memberId;
        private String name;
        private List<Long> memberIds;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class MyGroup {
        private Long memberId;
        private GroupMemberStatus status;

        public static MyGroup of(Long memberId, GroupMemberStatus status) {
            return MyGroup
                    .builder()
                    .memberId(memberId)
                    .status(status)
                    .build();
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Update {
        private Long groupId;
        private String name;
        private String description;
        private String thumbnailUrl;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Leave {
        private Long groupId;
        private Long memberId;

        public static Leave of(Long groupId, Long memberId) {
            return Leave
                    .builder()
                    .groupId(groupId)
                    .memberId(memberId)
                    .build();
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Invite {
        private Long groupId;
        private List<Long> memberIds;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Link {
        private Long groupId;
        private Long memberId;
        private String inviteToken;

        public static Link of(Long groupId, Long memberId, String inviteToken) {
            return Link
                    .builder()
                    .groupId(groupId)
                    .memberId(memberId)
                    .inviteToken(inviteToken)
                    .build();
        }
    }

}
