package com.ssafy.keepick.controller.group.response;

import com.ssafy.keepick.service.group.dto.MemberDto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupMemberResponse {
    private Long invitationId;
    private Long memberId;
    private String name;
    private String nickname;
    private String email;
    private String profileUrl;
    private LocalDateTime joinedAt;

    public static GroupMemberResponse toResponse(MemberDto dto) {
        return GroupMemberResponse
                .builder()
                .invitationId(dto.getGroupMemberId())
                .memberId(dto.getMemberId())
                .name(dto.getName())
                .nickname(dto.getNickname())
                .email(dto.getEmail())
                .profileUrl(dto.getProfileUrl())
                .joinedAt(dto.getInvitationUpdatedAt())
                .build();

    }

}
