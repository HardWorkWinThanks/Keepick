package com.ssafy.keepick.member.controller.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 닉네임 중복검사 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NicknameCheckResponse {
    
    /**
     * 사용 가능한 닉네임인지 여부
     */
    private boolean available;
    
    /**
     * 닉네임
     */
    private String nickname;
    
    /**
     * 닉네임 중복검사 결과를 생성합니다.
     * 
     * @param nickname 검사한 닉네임
     * @param available 사용 가능 여부
     * @return 닉네임 중복검사 응답
     */
    public static NicknameCheckResponse of(String nickname, boolean available) {
        return NicknameCheckResponse.builder()
                .nickname(nickname)
                .available(available)
                .build();
    }
}
