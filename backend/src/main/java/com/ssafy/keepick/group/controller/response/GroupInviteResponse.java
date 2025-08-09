package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupInviteResponse {
    @Schema(description = "그룹 초대 ID", example = "101")
    private Long invitationId;

    @Schema(description = "그룹 ID", example = "202")
    private Long groupId;

    @Schema(description = "초대 요청받은 멤버 ID", example = "303")
    private Long memberId;

    @Schema(description = "초대 상태 (예: PENDING, ACCEPTED, REJECTED)", example = "PENDING")
    private String status;

    @Schema(description = "초대 생성 일시", example = "2025-08-09T14:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "초대 수정 일시", example = "2025-08-10T16:00:00")
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
