package com.ssafy.keepick.service.group;

import com.ssafy.keepick.entity.Group;
import com.ssafy.keepick.entity.GroupMember;
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

    @Builder
    @Getter
    public static class GroupMemberInfo {
        private Long groupMemberId;
        private Long groupId;
        private String groupName;
        private Integer memberCount;
        private Long memberId;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static GroupMemberInfo from(GroupMember groupMember) {
            return GroupMemberInfo
                    .builder()
                    .groupMemberId(groupMember.getId())
                    .groupId(groupMember.getGroup().getId())
                    .groupName(groupMember.getGroup().getName())
                    .memberCount(groupMember.getGroup().getMemberCount())
                    .memberId(groupMember.getMember().getId())
                    .status(groupMember.getStatus().name())
                    .createdAt(groupMember.getCreatedAt())
                    .updatedAt(groupMember.getUpdatedAt())
                    .build();
        }
    }

    @Builder
    @Getter
    public static class Member {

        private Long groupMemberId;
        private Long memberId;
        private String name;
        private String nickname;
        private String email;
        private String profileUrl;
        private LocalDateTime invitationCreatedAt;
        private LocalDateTime invitationUpdatedAt;

        public static GroupResult.Member from(GroupMember groupMember) {
            return GroupResult.Member
                    .builder()
                    .groupMemberId(groupMember.getId())
                    .memberId(groupMember.getMember().getId())
                    .name(groupMember.getMember().getName())
                    .nickname(groupMember.getMember().getNickname())
                    .email(groupMember.getMember().getEmail())
                    .profileUrl(groupMember.getMember().getProfileUrl())
                    .invitationCreatedAt(groupMember.getCreatedAt())
                    .invitationUpdatedAt(groupMember.getUpdatedAt())
                    .build();
        }
    }

}
