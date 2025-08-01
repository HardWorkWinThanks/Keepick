package com.ssafy.keepick.service.group.dto;

import com.ssafy.keepick.entity.GroupMember;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MemberDto {

    private Long groupMemberId;
    private Long memberId;
    private String name;
    private String nickname;
    private String email;
    private String profileUrl;
    private LocalDateTime invitationCreatedAt;
    private LocalDateTime invitationUpdatedAt;

    public static MemberDto from(GroupMember groupMember) {
        return MemberDto
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
