package com.ssafy.keepick.member.controller.response;

import com.ssafy.keepick.auth.application.dto.MemberDto;
import lombok.Builder;
import lombok.Getter;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "회원 상세 정보 응답")
public class MemberInfoResponse {
    
    @Schema(description = "회원 고유 ID", example = "1")
    private Long memberId;
    
    @Schema(description = "닉네임", example = "홍길동")
    private String nickname;
    
    @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileUrl;
    
    @Schema(description = "이메일 주소", example = "user@example.com")
    private String email;
    
    @Schema(
        description = "소셜 로그인 제공자", 
        example = "kakao",
        allowableValues = {"kakao", "google", "naver"}
    )
    private String provider;
    
    @Schema(description = "신분증 이미지 URL (선택사항)", example = "https://example.com/id.jpg")
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