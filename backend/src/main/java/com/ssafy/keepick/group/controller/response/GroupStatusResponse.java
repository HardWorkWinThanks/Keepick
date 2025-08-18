package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.GroupMemberDto;
import com.ssafy.keepick.group.domain.GroupMemberStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupStatusResponse {

    @Schema(description = "그룹 ID", example = "101")
    private Long groupId;

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    private String name;

    @Schema(description = "그룹 회원 수", example = "10")
    private Integer memberCount;

    @Schema(description = "그룹 초대 ID", example = "101")
    private Long invitationId;

    @Schema(description = "그룹 가입 상태 (ACCEPTED, PENDING, REJECTED, LEFT)", example = "PENDING")
    private GroupMemberStatus invitationStatus;

    public static GroupStatusResponse toResponse(GroupMemberDto dto) {
        return GroupStatusResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getGroupName())
                .memberCount(dto.getMemberCount())
                .invitationId(dto.getGroupMemberId())
                .invitationStatus(dto.getStatus())
                .build();
    }

}
