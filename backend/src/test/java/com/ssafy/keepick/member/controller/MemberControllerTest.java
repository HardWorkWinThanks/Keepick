package com.ssafy.keepick.member.controller;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;

@ExtendWith(MockitoExtension.class)
class MemberControllerTest {

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    private MemberInfoResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockResponse = MemberInfoResponse.builder()
                .memberId(42L)
                .nickname("박재완")
                .profile_url("https://cdn.keepick.com/profile/42.png")
                .email("jaewan@example.com")
                .provider("kakao")
                .identification_url("https://example.com")
                .build();
    }

    @Test
    @DisplayName("현재 사용자 정보 조회 API 성공")
    void getCurrentMemberInfo_Success() {
        // given
        given(memberService.getCurrentMemberInfo()).willReturn(mockResponse);

        // when
        ResponseEntity<MemberInfoResponse> response = memberController.getCurrentMemberInfo();

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMemberId()).isEqualTo(42L);
        assertThat(response.getBody().getNickname()).isEqualTo("박재완");
        assertThat(response.getBody().getProfile_url()).isEqualTo("https://cdn.keepick.com/profile/42.png");
        assertThat(response.getBody().getEmail()).isEqualTo("jaewan@example.com");
        assertThat(response.getBody().getProvider()).isEqualTo("kakao");
        assertThat(response.getBody().getIdentification_url()).isEqualTo("https://example.com");

        verify(memberService).getCurrentMemberInfo();
    }

    @Test
    @DisplayName("회원이 존재하지 않을 때 예외 처리")
    void getCurrentMemberInfo_MemberNotFound_ThrowsException() {
        // given
        given(memberService.getCurrentMemberInfo())
                .willThrow(new BaseException(ErrorCode.MEMBER_NOT_FOUND));

        // when & then
        assertThatThrownBy(() -> memberController.getCurrentMemberInfo())
                .isInstanceOf(BaseException.class)
                .hasMessage("존재하지 않는 회원입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);

        verify(memberService).getCurrentMemberInfo();
    }

    @Test
    @DisplayName("인증되지 않은 사용자 접근시 예외 처리")
    void getCurrentMemberInfo_Unauthorized_ThrowsException() {
        // given
        given(memberService.getCurrentMemberInfo())
                .willThrow(new BaseException(ErrorCode.UNAUTHORIZED));

        // when & then
        assertThatThrownBy(() -> memberController.getCurrentMemberInfo())
                .isInstanceOf(BaseException.class)
                .hasMessage("인증이 필요합니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.UNAUTHORIZED);

        verify(memberService).getCurrentMemberInfo();
    }
}