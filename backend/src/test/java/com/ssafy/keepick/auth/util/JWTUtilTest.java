package com.ssafy.keepick.auth.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JWTUtilTest {

    private JWTUtil jwtUtil;
    private final String secretKey = "test-super-secret-jwt-key-for-testing-minimum-32-characters-long";
    private final long expiredMs = 3600000L; // 1시간

    @BeforeEach
    void setUp() {
        jwtUtil = new JWTUtil(secretKey, expiredMs);
    }

    @Test
    @DisplayName("JWT 토큰이 정상적으로 생성된다")
    void shouldCreateTokenSuccessfully() {
        // given
        Long memberId = 1L;
        String username = "test@example.com";

        // when
        String token = jwtUtil.createToken(memberId, username);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT는 3개 부분으로 구성
    }

    @Test
    @DisplayName("토큰에서 사용자명을 정상적으로 추출한다")
    void shouldExtractUsernameFromToken() {
        // given
        Long memberId = 1L;
        String username = "test@example.com";
        String token = jwtUtil.createToken(memberId, username);

        // when
        String extractedUsername = jwtUtil.getUsername(token);

        // then
        assertThat(extractedUsername).isEqualTo(username);
    }

    @Test
    @DisplayName("토큰에서 회원 ID를 정상적으로 추출한다")
    void shouldExtractMemberIdFromToken() {
        // given
        Long memberId = 12345L;
        String username = "test@example.com";
        String token = jwtUtil.createToken(memberId, username);

        // when
        Long extractedMemberId = jwtUtil.getMemberId(token);

        // then
        assertThat(extractedMemberId).isEqualTo(memberId);
    }

    @Test
    @DisplayName("토큰에서 역할을 정상적으로 추출한다")
    void shouldExtractRoleFromToken() {
        // given
        Long memberId = 1L;
        String username = "test@example.com";
        String token = jwtUtil.createToken(memberId, username);

        // when
        String extractedRole = jwtUtil.getRole(token);

        // then
        assertThat(extractedRole).isEqualTo("ROLE_USER"); // 하드코딩된 값
    }

    @Test
    @DisplayName("유효한 토큰의 만료 여부를 정확히 판단한다")
    void shouldDetectTokenExpiration() {
        // given - 만료 시간이 매우 짧은 JWTUtil 생성
        JWTUtil shortLivedJwtUtil = new JWTUtil(secretKey, 1L); // 1ms
        Long memberId = 1L;
        String username = "test@example.com";
        
        // 이미 만료된 토큰 생성
        String expiredToken = shortLivedJwtUtil.createToken(memberId, username);
        
        // 유효한 토큰 생성
        String validToken = jwtUtil.createToken(memberId, username);

        // 만료된 토큰 테스트를 위해 잠시 대기
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // when & then
        // 만료된 토큰은 ExpiredJwtException을 발생시킴
        assertThatThrownBy(() -> shortLivedJwtUtil.isExpired(expiredToken))
                .isInstanceOf(Exception.class);
        
        // 유효한 토큰은 false 반환
        assertThat(jwtUtil.isExpired(validToken)).isFalse();
    }

    @Test
    @DisplayName("잘못된 형식의 토큰에 대해 예외가 발생한다")
    void shouldThrowExceptionForInvalidTokenFormat() {
        // given
        String invalidToken = "invalid.token.format";

        // when & then
        assertThatThrownBy(() -> jwtUtil.getUsername(invalidToken))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("서명이 잘못된 토큰에 대해 예외가 발생한다")
    void shouldThrowExceptionForInvalidSignature() {
        // given
        Long memberId = 1L;
        String username = "test@example.com";
        String token = jwtUtil.createToken(memberId, username);
        
        // 토큰의 마지막 부분을 변조
        String tamperedToken = token.substring(0, token.lastIndexOf('.')) + ".tamperedSignature";

        // when & then
        assertThatThrownBy(() -> jwtUtil.getUsername(tamperedToken))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("null 토큰에 대해 예외가 발생한다")
    void shouldThrowExceptionForNullToken() {
        // when & then
        assertThatThrownBy(() -> jwtUtil.getUsername(null))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("빈 토큰에 대해 예외가 발생한다")
    void shouldThrowExceptionForEmptyToken() {
        // when & then
        assertThatThrownBy(() -> jwtUtil.getUsername(""))
                .isInstanceOf(Exception.class);
    }
} 