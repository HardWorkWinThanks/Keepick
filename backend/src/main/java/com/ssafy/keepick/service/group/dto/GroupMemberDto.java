package com.ssafy.keepick.service.group.dto;

import com.ssafy.keepick.entity.GroupMember;
import com.ssafy.keepick.entity.GroupMemberStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupMemberDto {
    private Long groupMemberId;
    private Long groupId;
    private String groupName;
    private Integer memberCount;
    private Long memberId;
    private GroupMemberStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupMemberDto from(GroupMember groupMember) {
        return GroupMemberDto
                .builder()
                .groupMemberId(groupMember.getId())
                .groupId(groupMember.getGroup().getId())
                .groupName(groupMember.getGroup().getName())
                .memberCount(groupMember.getGroup().getMemberCount())
                .memberId(groupMember.getMember().getId())
                .status(groupMember.getStatus())
                .createdAt(groupMember.getCreatedAt())
                .updatedAt(groupMember.getUpdatedAt())
                .build();
    }
}
