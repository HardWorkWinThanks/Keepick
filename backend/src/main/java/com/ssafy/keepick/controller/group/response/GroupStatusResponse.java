package com.ssafy.keepick.controller.group.response;

import com.ssafy.keepick.service.group.dto.GroupMemberDto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupStatusResponse {

    private Long groupId;
    private String name;
    private Integer memberCount;
    private Long invitationId;
    private String invitationStatus;

    public static GroupStatusResponse toResponse(GroupMemberDto dto) {
        return GroupStatusResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getGroupName())
                .memberCount(dto.getMemberCount())
                .invitationId(dto.getGroupMemberId())
                .invitationStatus(dto.getStatus().name())
                .build();
    }

}
