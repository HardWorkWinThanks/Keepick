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

import com.ssafy.keepick.auth.application.dto.MobileLoginDto;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.JWTUtil;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MobileAuthServiceTest extends BaseTest {

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
        given(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .willReturn(new ResponseEntity<>(googleUserInfo, HttpStatus.OK));

        // when
        MobileLoginDto loginDto = mobileAuthService.login(request);
        MobileLoginResponse response = loginDto.toResponse();

        // then
        assertThat(loginDto.getAccessToken()).isEqualTo("jwt-token");
        assertThat(loginDto.getRefreshTokenJti()).isEqualTo("refresh-token-jti");
        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token-jti");
        verify(jwtUtil).createToken(1L, "test@gmail.com");
        verify(refreshTokenService).issue(1L, "test@gmail.com", anyString());
    }
}
