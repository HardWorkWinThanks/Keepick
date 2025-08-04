package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.auth.application.dto.MemberDto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberInfoResponse {
    
    private Long memberId;
    private String nickname;
    private String profileUrl;
    private String email;
    private String provider;
    private String identificationUrl;
    
    public static MemberInfoResponse from(MemberDto memberDto) {
        return MemberInfoResponse.builder()
                .memberId(memberDto.getMemberId())
                .nickname(memberDto.getNickname())
                .profileUrl(memberDto.getProfileUrl())
                .email(memberDto.getEmail())
                .provider(memberDto.getProvider())
                .identificationUrl(memberDto.getIdentificationUrl())
                .build();
    }
}