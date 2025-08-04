package com.ssafy.keepick.member.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private MemberService memberService;

    private Member testMember;
    private Long testMemberId;

    @BeforeEach
    void setUp() {
        testMemberId = 42L;
        testMember = mock(Member.class);
    }

    @Test
    @DisplayName("현재 로그인한 사용자 정보 조회 성공")
    void getCurrentMemberInfo_Success() {
        // given
        // Member 객체의 메서드들을 모킹
        given(testMember.getId()).willReturn(testMemberId);
        given(testMember.getNickname()).willReturn("박재완");
        given(testMember.getProfileUrl()).willReturn("https://cdn.keepick.com/profile/42.png");
        given(testMember.getEmail()).willReturn("jaewan@example.com");
        given(testMember.getProvider()).willReturn("kakao");
        given(testMember.getIdentificationUrl()).willReturn("https://example.com");
        
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);
            given(memberRepository.findById(testMemberId)).willReturn(Optional.of(testMember));

            // when
            MemberInfoResponse response = memberService.getCurrentMemberInfo();

            // then
            assertThat(response).isNotNull();
            assertThat(response.getMemberId()).isEqualTo(testMemberId);
            assertThat(response.getNickname()).isEqualTo("박재완");
            assertThat(response.getProfile_url()).isEqualTo("https://cdn.keepick.com/profile/42.png");
            assertThat(response.getEmail()).isEqualTo("jaewan@example.com");
            assertThat(response.getProvider()).isEqualTo("kakao");
            assertThat(response.getIdentification_url()).isEqualTo("https://example.com");

            verify(memberRepository).findById(testMemberId);
        }
    }

    @Test
    @DisplayName("존재하지 않는 회원 ID로 조회시 예외 발생")
    void getCurrentMemberInfo_MemberNotFound_ThrowsException() {
        // given
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);
            given(memberRepository.findById(testMemberId)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> memberService.getCurrentMemberInfo())
                    .isInstanceOf(BaseException.class)
                    .hasMessage("존재하지 않는 회원입니다.")
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);

            verify(memberRepository).findById(testMemberId);
        }
    }

    @Test
    @DisplayName("인증되지 않은 사용자가 정보 조회시 예외 발생")
    void getCurrentMemberInfo_Unauthorized_ThrowsException() {
        // given
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId)
                    .thenThrow(new BaseException(ErrorCode.UNAUTHORIZED));

            // when & then
            assertThatThrownBy(() -> memberService.getCurrentMemberInfo())
                    .isInstanceOf(BaseException.class)
                    .hasMessage("인증이 필요합니다.")
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.UNAUTHORIZED);

            verify(memberRepository, never()).findById(any());
        }
    }
}