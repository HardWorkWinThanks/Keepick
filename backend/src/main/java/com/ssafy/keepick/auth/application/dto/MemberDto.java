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
}
