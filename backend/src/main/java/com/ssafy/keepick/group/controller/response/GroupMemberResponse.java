package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.MemberDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupMemberResponse {
    @Schema(description = "그룹 초대 ID", example = "101")
    private Long invitationId;

    @Schema(description = "그룹 회원 ID", example = "202")
    private Long memberId;

    @Schema(description = "회원 이름", example = "홍길동")
    private String name;

    @Schema(description = "회원 닉네임", example = "gildong123")
    private String nickname;

    @Schema(description = "회원 이메일 주소", example = "gildong@example.com")
    private String email;

    @Schema(description = "회원 프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileUrl;

    @Schema(description = "그룹 가입 일시", example = "2025-08-09T14:30:00")
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
