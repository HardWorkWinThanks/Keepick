package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.auth.application.dto.MemberDto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberSearchResponse {
    
    private Long memberId;
    private String nickname;
    private String profileUrl;
    
    public static MemberSearchResponse from(MemberDto memberDto) {
        return MemberSearchResponse.builder()
                .memberId(memberDto.getMemberId())
                .nickname(memberDto.getNickname())
                .profileUrl(memberDto.getProfileUrl())
                .build();
    }
} 