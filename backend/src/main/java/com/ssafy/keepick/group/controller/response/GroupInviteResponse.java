package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupInviteResponse {
    private Long invitationId;
    private Long groupId;
    private Long memberId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GroupInviteResponse toResponse(GroupMemberDto dto) {
        return GroupInviteResponse
                .builder()
                .invitationId(dto.getGroupMemberId())
                .groupId(dto.getGroupId())
                .memberId(dto.getMemberId())
                .status(dto.getStatus().name())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
