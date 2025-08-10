package com.ssafy.keepick.member.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.Optional;

import com.ssafy.keepick.support.BaseTest;
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
import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import com.ssafy.keepick.member.controller.response.MemberSearchResponse;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest extends BaseTest {

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
            MemberDto response = memberService.getCurrentMemberInfo();

            // then
            assertThat(response).isNotNull();
            assertThat(response.getMemberId()).isEqualTo(testMemberId);
            assertThat(response.getNickname()).isEqualTo("박재완");
            assertThat(response.getProfileUrl()).isEqualTo("https://cdn.keepick.com/profile/42.png");
            assertThat(response.getEmail()).isEqualTo("jaewan@example.com");
            assertThat(response.getProvider()).isEqualTo("kakao");
            assertThat(response.getIdentificationUrl()).isEqualTo("https://example.com");

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
    
    @Test
    @DisplayName("사용자 정보 수정 성공 - 닉네임만 수정")
    void updateCurrentMemberInfo_Success_UpdateNicknameOnly() {
        // given
        String newNickname = "새로운닉네임";
        MemberUpdateRequest request = new MemberUpdateRequest(newNickname, null, null);
        
        given(testMember.getId()).willReturn(testMemberId);
        given(testMember.getNickname()).willReturn(newNickname);
        given(testMember.getProfileUrl()).willReturn("https://cdn.keepick.com/profile/42.png");
        given(testMember.getEmail()).willReturn("jaewan@example.com");
        given(testMember.getProvider()).willReturn("kakao");
        given(testMember.getIdentificationUrl()).willReturn("https://example.com");
        
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);
            given(memberRepository.findById(testMemberId)).willReturn(Optional.of(testMember));

            // when
            MemberDto response = memberService.updateCurrentMemberInfo(request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getNickname()).isEqualTo(newNickname);
            verify(testMember).updateProfile(newNickname, null, null);
        }
    }
    
    @Test
    @DisplayName("사용자 정보 수정 성공 - 모든 필드 수정")
    void updateCurrentMemberInfo_Success_UpdateAllFields() {
        // given
        String newNickname = "새로운닉네임";
        String newProfileUrl = "https://cdn.keepick.com/profile/new.png";
        String newIdentificationUrl = "https://example.com/new.jpg";
        MemberUpdateRequest request = new MemberUpdateRequest(newNickname, newProfileUrl, newIdentificationUrl);
        
        given(testMember.getId()).willReturn(testMemberId);
        given(testMember.getNickname()).willReturn(newNickname);
        given(testMember.getProfileUrl()).willReturn(newProfileUrl);
        given(testMember.getEmail()).willReturn("jaewan@example.com");
        given(testMember.getProvider()).willReturn("kakao");
        given(testMember.getIdentificationUrl()).willReturn(newIdentificationUrl);
        
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);
            given(memberRepository.findById(testMemberId)).willReturn(Optional.of(testMember));

            // when
            MemberDto response = memberService.updateCurrentMemberInfo(request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getNickname()).isEqualTo(newNickname);
            assertThat(response.getProfileUrl()).isEqualTo(newProfileUrl);
            assertThat(response.getIdentificationUrl()).isEqualTo(newIdentificationUrl);
            verify(testMember).updateProfile(newNickname, newProfileUrl, newIdentificationUrl);
        }
    }
    
    @Test
    @DisplayName("수정할 정보가 없을 때 예외 발생")
    void updateCurrentMemberInfo_NoUpdateFields_ThrowsException() {
        // given
        MemberUpdateRequest request = new MemberUpdateRequest(null, null, null);
        
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);

            // when & then
            assertThatThrownBy(() -> memberService.updateCurrentMemberInfo(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessage("잘못된 요청 파라미터입니다.")
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.INVALID_PARAMETER);

            verify(memberRepository, never()).findById(any());
        }
    }
    
    @Test
    @DisplayName("존재하지 않는 회원 정보 수정시 예외 발생")
    void updateCurrentMemberInfo_MemberNotFound_ThrowsException() {
        // given
        MemberUpdateRequest request = new MemberUpdateRequest("새로운닉네임", null, null);
        
        try (MockedStatic<AuthenticationUtil> mockedAuthUtil = mockStatic(AuthenticationUtil.class)) {
            mockedAuthUtil.when(AuthenticationUtil::getCurrentUserId).thenReturn(testMemberId);
            given(memberRepository.findById(testMemberId)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> memberService.updateCurrentMemberInfo(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessage("존재하지 않는 회원입니다.")
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);

            verify(memberRepository).findById(testMemberId);
        }
    }
    
    @Test
    @DisplayName("닉네임으로 사용자 검색 성공")
    void searchMemberByNickname_Success() {
        // given
        String searchNickname = "테스트닉네임";
        given(testMember.getId()).willReturn(testMemberId);
        given(testMember.getNickname()).willReturn(searchNickname);
        given(testMember.getProfileUrl()).willReturn("https://example.com/profile.jpg");
        given(testMember.getEmail()).willReturn("test@example.com");
        given(testMember.getProvider()).willReturn("kakao");
        given(testMember.getIdentificationUrl()).willReturn("https://example.com/id.jpg");
        given(memberRepository.findByNickname(searchNickname)).willReturn(Optional.of(testMember));

        // when
        MemberDto response = memberService.searchMemberByNickname(searchNickname);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getMemberId()).isEqualTo(testMemberId);
        assertThat(response.getNickname()).isEqualTo(searchNickname);
        assertThat(response.getProfileUrl()).isEqualTo("https://example.com/profile.jpg");
        verify(memberRepository).findByNickname(searchNickname);
    }
    
    @Test
    @DisplayName("닉네임으로 사용자 검색 성공 - 프로필 이미지가 null인 경우")
    void searchMemberByNickname_Success_WithNullProfileUrl() {
        // given
        String searchNickname = "테스트닉네임";
        given(testMember.getId()).willReturn(testMemberId);
        given(testMember.getNickname()).willReturn(searchNickname);
        given(testMember.getProfileUrl()).willReturn(null);
        given(testMember.getEmail()).willReturn("test@example.com");
        given(testMember.getProvider()).willReturn("kakao");
        given(testMember.getIdentificationUrl()).willReturn("https://example.com/id.jpg");
        given(memberRepository.findByNickname(searchNickname)).willReturn(Optional.of(testMember));

        // when
        MemberDto response = memberService.searchMemberByNickname(searchNickname);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getMemberId()).isEqualTo(testMemberId);
        assertThat(response.getNickname()).isEqualTo(searchNickname);
        assertThat(response.getProfileUrl()).isNull();
        verify(memberRepository).findByNickname(searchNickname);
    }
    
    @Test
    @DisplayName("존재하지 않는 닉네임으로 검색시 예외 발생")
    void searchMemberByNickname_MemberNotFound_ThrowsException() {
        // given
        String searchNickname = "존재하지않는닉네임";
        given(memberRepository.findByNickname(searchNickname)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> memberService.searchMemberByNickname(searchNickname))
                .isInstanceOf(BaseException.class)
                .hasMessage("존재하지 않는 회원입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);

        verify(memberRepository).findByNickname(searchNickname);
    }
    
    @Test
    @DisplayName("빈 닉네임으로 검색시 예외 발생")
    void searchMemberByNickname_EmptyNickname_ThrowsException() {
        // given
        String emptyNickname = "";

        // when & then
        assertThatThrownBy(() -> memberService.searchMemberByNickname(emptyNickname))
                .isInstanceOf(BaseException.class)
                .hasMessage("잘못된 요청 파라미터입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PARAMETER);

        verify(memberRepository, never()).findByNickname(any());
    }
    
    @Test
    @DisplayName("공백만 있는 닉네임으로 검색시 예외 발생")
    void searchMemberByNickname_BlankNickname_ThrowsException() {
        // given
        String blankNickname = "   ";

        // when & then
        assertThatThrownBy(() -> memberService.searchMemberByNickname(blankNickname))
                .isInstanceOf(BaseException.class)
                .hasMessage("잘못된 요청 파라미터입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PARAMETER);

        verify(memberRepository, never()).findByNickname(any());
    }
    
    @Test
    @DisplayName("null 닉네임으로 검색시 예외 발생")
    void searchMemberByNickname_NullNickname_ThrowsException() {
        // given
        String nullNickname = null;

        // when & then
        assertThatThrownBy(() -> memberService.searchMemberByNickname(nullNickname))
                .isInstanceOf(BaseException.class)
                .hasMessage("잘못된 요청 파라미터입니다.")
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PARAMETER);

        verify(memberRepository, never()).findByNickname(any());
    }
}