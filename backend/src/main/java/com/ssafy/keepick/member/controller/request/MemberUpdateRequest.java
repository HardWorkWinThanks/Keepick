package com.ssafy.keepick.member.controller.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberUpdateRequest {
    
    private String nickname;
    private String profileUrl;
    private String identificationUrl;
    
    public MemberUpdateRequest(String nickname, String profileUrl, String identificationUrl) {
        this.nickname = nickname;
        this.profileUrl = profileUrl;
        this.identificationUrl = identificationUrl;
    }
    
    /**
     * 최소 하나 이상의 필드가 수정되었는지 확인
     */
    public boolean hasAnyUpdate() {
        return nickname != null || profileUrl != null || identificationUrl != null;
    }
} 