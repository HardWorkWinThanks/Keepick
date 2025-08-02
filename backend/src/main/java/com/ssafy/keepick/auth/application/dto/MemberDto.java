package com.ssafy.keepick.auth.application.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MemberDto {
    private final Long memberId;
    private final String username;
    private final String role;
    private final String name;
    private final String email;
    private final String nickname;
    private final String profileUrl;
    private final String provider;
    private final String providerId;

    // JWT 인증용 - 기본 정보만으로 생성
    public static MemberDto of(Long memberId, String username, String role) {
        return MemberDto.builder()
                .memberId(memberId)
                .username(username)
                .role(role)
                .build();
    }
    
    // Member 엔티티에서 MemberDto로 변환
    public static MemberDto from(com.ssafy.keepick.member.domain.Member member) {
        return MemberDto.builder()
                .memberId(member.getId())
                .username(member.getEmail())
                .role("ROLE_USER")
                .name(member.getName())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .profileUrl(member.getProfileUrl())
                .provider(member.getProvider())
                .providerId(member.getProviderId())
                .build();
    }
}
