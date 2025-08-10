package com.ssafy.keepick.member.controller.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@NoArgsConstructor
@Schema(description = "회원 정보 수정 요청")
public class MemberUpdateRequest {
    
    @Schema(
        description = "수정할 닉네임 (선택사항)", 
        example = "새로운닉네임"
    )
    private String nickname;
    
    @Schema(
        description = "수정할 프로필 이미지 URL (선택사항)", 
        example = "https://example.com/new-profile.jpg"
    )
    private String profileUrl;
    
    @Schema(
        description = "수정할 AI 식별용 이미지 URL (선택사항)", 
        example = "https://example.com/new-identification.jpg"
    )
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