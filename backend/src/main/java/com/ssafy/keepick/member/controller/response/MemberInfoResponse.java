package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.member.domain.Member;
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
    
    public static MemberInfoResponse from(Member member) {
        return MemberInfoResponse.builder()
                .memberId(member.getId())
                .nickname(member.getNickname())
                .profileUrl(member.getProfileUrl())
                .email(member.getEmail())
                .provider(member.getProvider())
                .identificationUrl(member.getIdentificationUrl())
                .build();
    }
}