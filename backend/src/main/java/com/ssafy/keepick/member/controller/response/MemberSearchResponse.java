package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.auth.application.dto.MemberDto;

import lombok.Builder;
import lombok.Getter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "회원 검색 결과 응답")
public class MemberSearchResponse {
    
    @Schema(description = "회원 고유 ID", example = "2")
    private Long memberId;
    
    @Schema(description = "닉네임", example = "김철수")
    private String nickname;

    @Schema(description = "프로필 이미지 URL (회원의 프로필 이미지가 없는 경우 null 입니다)", example = "https://example.com/profile.jpg", nullable = true)
    private String profileUrl;
    
    public static MemberSearchResponse from(MemberDto memberDto) {
        return MemberSearchResponse.builder()
                .memberId(memberDto.getMemberId())
                .nickname(memberDto.getNickname())
                .profileUrl(memberDto.getProfileUrl())
                .build();
    }
} 