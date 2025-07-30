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

    @Builder
    @Getter
    public static class Detail {
        private Long groupId;
        private String name;
        private String description;
        private String thumbnailUrl;
        private Integer memberCount;
        private Long creatorId;
        private String creatorName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Detail from(GroupResult.GroupInfo result) {
            return Detail
                    .builder()
                    .groupId(result.getGroupId())
                    .name(result.getName())
                    .description(result.getDescription())
                    .thumbnailUrl(result.getThumbnailUrl())
                    .memberCount(result.getMemberCount())
                    .creatorId(result.getCreatorId())
                    .creatorName(result.getCreatorName())
                    .createdAt(result.getCreatedAt())
                    .updatedAt(result.getUpdatedAt())
                    .build();
        }
    }

    @Builder
    @Getter
    public static class Member {

        private Long invitationId;
        private Long memberId;
        private String name;
        private String nickname;
        private String email;
        private String profileUrl;
        private LocalDateTime joinedAt;

        public static GroupResponse.Member from(GroupResult.Member result) {
            return Member
                    .builder()
                    .invitationId(result.getGroupMemberId())
                    .memberId(result.getMemberId())
                    .name(result.getName())
                    .nickname(result.getNickname())
                    .email(result.getEmail())
                    .profileUrl(result.getProfileUrl())
                    .joinedAt(result.getInvitationUpdatedAt())
                    .build();
        }
    }

    @Builder
    @Getter
    public static class Invitation {
        private Long invitationId;
        private Long groupId;
        private Long memberId;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Invitation from(GroupResult.GroupMemberInfo result) {
            return Invitation.builder()
                    .invitationId(result.getGroupMemberId())
                    .groupId(result.getGroupId())
                    .memberId(result.getMemberId())
                    .status(result.getStatus())
                    .createdAt(result.getCreatedAt())
                    .updatedAt(result.getUpdatedAt())
                    .build();
        }
    }

}
