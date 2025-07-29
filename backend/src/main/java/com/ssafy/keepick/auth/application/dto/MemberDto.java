package com.ssafy.keepick.auth.application.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberDto {
    private Long memberId;
    private String username;
    private String role;
    private String name;
    private String email;
    private String nickname;
    private String profileUrl;
    private String provider;
    private String providerId;
}
