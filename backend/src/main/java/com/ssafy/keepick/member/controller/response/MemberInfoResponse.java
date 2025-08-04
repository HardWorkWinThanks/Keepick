package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.member.domain.Member;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberInfoResponse {
    
    private Long memberId;
    private String nickname;
    private String profile_url;
    private String email;
    private String provider;
    private String identification_url;
    
    public static MemberInfoResponse from(Member member) {
        return MemberInfoResponse.builder()
                .memberId(member.getId())
                .nickname(member.getNickname())
                .profile_url(member.getProfileUrl())
                .email(member.getEmail())
                .provider(member.getProvider())
                .identification_url(member.getIdentificationUrl())
                .build();
    }
}