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

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.auth.application.dto.MemberDto;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;

@ExtendWith(MockitoExtension.class)
class MemberControllerTest {

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    private MemberInfoResponse mockResponse;

    private MemberDto mockMemberDto;

    @BeforeEach
    void setUp() {
        mockMemberDto = MemberDto.builder()
                .memberId(42L)
                .nickname("박재완")
                .profileUrl("https://cdn.keepick.com/profile/42.png")
                .email("jaewan@example.com")
                .provider("kakao")
                .identificationUrl("https://example.com")
                .build();
    }

    @Test
    @DisplayName("현재 사용자 정보 조회 API 성공")
    void getCurrentMemberInfo_Success() {
        // given
        given(memberService.getCurrentMemberInfo()).willReturn(mockMemberDto);

        // when
        ApiResponse<MemberInfoResponse> response = memberController.getCurrentMemberInfo();

        // then
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getMemberId()).isEqualTo(42L);
        assertThat(response.getData().getNickname()).isEqualTo("박재완");
        assertThat(response.getData().getProfileUrl()).isEqualTo("https://cdn.keepick.com/profile/42.png");
        assertThat(response.getData().getEmail()).isEqualTo("jaewan@example.com");
        assertThat(response.getData().getProvider()).isEqualTo("kakao");
        assertThat(response.getData().getIdentificationUrl()).isEqualTo("https://example.com");

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
    
    @Test
    @DisplayName("사용자 정보 수정 API 성공 - 닉네임만 수정")
    void updateCurrentMemberInfo_Success_UpdateNicknameOnly() {
        // given
        String newNickname = "새로운닉네임";
        MemberUpdateRequest request = new MemberUpdateRequest(newNickname, null, null);
        
        MemberDto updatedMemberDto = MemberDto.builder()
                .memberId(42L)
                .nickname(newNickname)
                .profileUrl("https://cdn.keepick.com/profile/42.png")
                .email("jaewan@example.com")
                .provider("kakao")
                .identificationUrl("https://example.com")
                .build();
        
        given(memberService.updateCurrentMemberInfo(request)).willReturn(updatedMemberDto);

        // when
        ApiResponse<MemberInfoResponse> response = memberController.updateCurrentMemberInfo(request);

        // then
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getNickname()).isEqualTo(newNickname);
        verify(memberService).updateCurrentMemberInfo(request);
    }
    
    @Test
    @DisplayName("사용자 정보 수정 API 성공 - 모든 필드 수정")
    void updateCurrentMemberInfo_Success_UpdateAllFields() {
        // given
        String newNickname = "새로운닉네임";
        String newProfileUrl = "https://cdn.keepick.com/profile/new.png";
        String newIdentificationUrl = "https://example.com/new.jpg";
        MemberUpdateRequest request = new MemberUpdateRequest(newNickname, newProfileUrl, newIdentificationUrl);
        
        MemberDto updatedMemberDto = MemberDto.builder()
                .memberId(42L)
                .nickname(newNickname)
                .profileUrl(newProfileUrl)
                .email("jaewan@example.com")
                .provider("kakao")
                .identificationUrl(newIdentificationUrl)
                .build();
        
        given(memberService.updateCurrentMemberInfo(request)).willReturn(updatedMemberDto);

        // when
        ApiResponse<MemberInfoResponse> response = memberController.updateCurrentMemberInfo(request);

        // then
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getNickname()).isEqualTo(newNickname);
        assertThat(response.getData().getProfileUrl()).isEqualTo(newProfileUrl);
        assertThat(response.getData().getIdentificationUrl()).isEqualTo(newIdentificationUrl);
        verify(memberService).updateCurrentMemberInfo(request);
    }
    
    @Test
    @DisplayName("수정할 정보가 없을 때 예외 처리")
    void updateCurrentMemberInfo_NoUpdateFields_ThrowsException() {
        // given
        MemberUpdateRequest request = new MemberUpdateRequest(null, null, null);
        given(memberService.updateCurrentMemberInfo(request))
                .willThrow(new BaseException(ErrorCode.INVALID_PARAMETER));

        // when & then
        assertThatThrownBy(() -> memberController.updateCurrentMemberInfo(request))
                .isInstanceOf(BaseException.class)
                .hasMessage("잘못된 요청 파라미터입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PARAMETER);

        verify(memberService).updateCurrentMemberInfo(request);
    }
}