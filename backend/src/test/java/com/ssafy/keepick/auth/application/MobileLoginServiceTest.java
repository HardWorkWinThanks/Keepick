package com.ssafy.keepick.auth.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.JWTUtil;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MobileLoginServiceTest extends BaseTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private JWTUtil jwtUtil;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private MobileAuthService mobileAuthService;

    private Map<String, Object> googleUserInfo;

    @BeforeEach
    void setUp() {
        // Google 사용자 정보 응답 모킹 데이터
        googleUserInfo = new HashMap<>();
        googleUserInfo.put("sub", "google-123");
        googleUserInfo.put("name", "홍길동");
        googleUserInfo.put("email", "test@gmail.com");
        googleUserInfo.put("picture", "https://profile.jpg");
    }

    @Test
    @DisplayName("Google 로그인 성공 - 기본 플로우 검증")
    void login_Google_Success() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "valid-token");
        
        // 간단한 Member Mock (ID는 고정값 사용)
        Member member = mock(Member.class);
        given(member.getId()).willReturn(1L);
        given(member.getEmail()).willReturn("test@gmail.com");
        
        given(memberRepository.findByEmail("test@gmail.com")).willReturn(Optional.of(member));
        given(jwtUtil.createToken(1L, "test@gmail.com")).willReturn("jwt-token");
        given(refreshTokenService.issue(1L, "test@gmail.com", anyString())).willReturn("refresh-token-jti");
        given(restTemplate.exchange(anyString(), any(), any(), any(Class.class)))
                .willReturn(new ResponseEntity<>(googleUserInfo, HttpStatus.OK));

        // when
        var loginDto = mobileAuthService.login(request);
        MobileLoginResponse response = loginDto.toResponse();

        // then
        assertThat(loginDto.getAccessToken()).isEqualTo("jwt-token");
        assertThat(loginDto.getRefreshTokenJti()).isEqualTo("refresh-token-jti");
        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token-jti");
        verify(jwtUtil).createToken(1L, "test@gmail.com");
        verify(refreshTokenService).issue(1L, "test@gmail.com", anyString());
    }

    @Test
    @DisplayName("지원하지 않는 provider로 로그인 시 예외 발생")
    void login_UnsupportedProvider_ThrowsException() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("facebook", "token");

        // when & then
        // facebook은 지원하지 않는 provider이므로 OAuth2_AUTHENTICATION_FAILED 예외가 발생할 수 있음
        assertThatThrownBy(() -> mobileAuthService.login(request))
                .isInstanceOf(BaseException.class)
                .matches(e -> {
                    BaseException be = (BaseException) e;
                    return be.getErrorCode() == ErrorCode.UNSUPPORTED_OAUTH2_PROVIDER 
                        || be.getErrorCode() == ErrorCode.OAUTH2_AUTHENTICATION_FAILED;
                });
    }

    @Test
    @DisplayName("OAuth2 API 호출 실패 시 예외 발생")
    void login_OAuth2ApiFailed_ThrowsException() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "invalid-token");
        given(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .willReturn(new ResponseEntity<>(null, HttpStatus.UNAUTHORIZED));

        // when & then
        assertThatThrownBy(() -> mobileAuthService.login(request))
                .isInstanceOf(BaseException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OAUTH2_AUTHENTICATION_FAILED);
    }

    @Test
    @DisplayName("신규 회원 생성 시 save 메서드 호출 검증")
    void login_NewMember_CallsSave() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "valid-token");
        
        Member savedMember = mock(Member.class);
        given(savedMember.getId()).willReturn(1L);
        given(savedMember.getEmail()).willReturn("test@gmail.com");
        
        given(memberRepository.findByEmail("test@gmail.com")).willReturn(Optional.empty()); // 신규 회원
        given(memberRepository.save(any(Member.class))).willReturn(savedMember);
        given(jwtUtil.createToken(1L, "test@gmail.com")).willReturn("jwt-token");
        given(refreshTokenService.issue(1L, "test@gmail.com", anyString())).willReturn("refresh-token-jti");
        given(restTemplate.exchange(anyString(), any(), any(), any(Class.class)))
                .willReturn(new ResponseEntity<>(googleUserInfo, HttpStatus.OK));

        // when
        mobileAuthService.login(request);

        // then
        verify(memberRepository).save(any(Member.class)); // 신규 회원이므로 save 호출
        verify(refreshTokenService).issue(1L, "test@gmail.com", anyString());
    }

    @Test
    @DisplayName("기존 회원 로그인 시 save 메서드 호출하지 않음")
    void login_ExistingMember_DoesNotCallSave() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "valid-token");
        
        Member existingMember = mock(Member.class);
        given(existingMember.getId()).willReturn(1L);
        given(existingMember.getEmail()).willReturn("test@gmail.com");
        
        given(memberRepository.findByEmail("test@gmail.com")).willReturn(Optional.of(existingMember)); // 기존 회원
        given(jwtUtil.createToken(1L, "test@gmail.com")).willReturn("jwt-token");
        given(refreshTokenService.issue(1L, "test@gmail.com", anyString())).willReturn("refresh-token-jti");
        given(restTemplate.exchange(anyString(), any(), any(), any(Class.class)))
                .willReturn(new ResponseEntity<>(googleUserInfo, HttpStatus.OK));

        // when
        mobileAuthService.login(request);

        // then
        verify(memberRepository, never()).save(any(Member.class)); // 기존 회원이므로 save 호출하지 않음
        verify(refreshTokenService).issue(1L, "test@gmail.com", anyString());
    }
}