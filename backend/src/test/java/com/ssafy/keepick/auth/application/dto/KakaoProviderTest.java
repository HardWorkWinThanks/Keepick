package com.ssafy.keepick.auth.application.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class KakaoProviderTest {

    @Test
    @DisplayName("카카오 사용자 정보가 정상적으로 파싱된다")
    void shouldParseKakaoUserInfoCorrectly() {
        // given
        Map<String, Object> profile = new HashMap<>();
        profile.put("nickname", "홍길동");
        profile.put("profile_image_url", "https://k.kakaocdn.net/profile.jpg");
        profile.put("thumbnail_image_url", "https://k.kakaocdn.net/thumb.jpg");

        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "hong@example.com");
        kakaoAccount.put("profile", profile);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        attributes.put("kakao_account", kakaoAccount);

        // when
        KakaoProvider kakaoProvider = KakaoProvider.from(attributes);

        // then
        assertThat(kakaoProvider.getProvider()).isEqualTo("kakao");
        assertThat(kakaoProvider.getProviderId()).isEqualTo("12345");
        assertThat(kakaoProvider.getName()).isEqualTo("홍길동");
        assertThat(kakaoProvider.getEmail()).isEqualTo("hong@example.com");
        assertThat(kakaoProvider.getProfileUrl()).isEqualTo("https://k.kakaocdn.net/profile.jpg");
    }

    @Test
    @DisplayName("프로필 이미지가 없을 때 썸네일 이미지를 반환한다")
    void shouldReturnThumbnailWhenProfileImageNotAvailable() {
        // given
        Map<String, Object> profile = new HashMap<>();
        profile.put("nickname", "홍길동");
        profile.put("thumbnail_image_url", "https://k.kakaocdn.net/thumb.jpg");
        // profile_image_url은 없음

        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "hong@example.com");
        kakaoAccount.put("profile", profile);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        attributes.put("kakao_account", kakaoAccount);

        // when
        KakaoProvider kakaoProvider = KakaoProvider.from(attributes);

        // then
        assertThat(kakaoProvider.getProfileUrl()).isEqualTo("https://k.kakaocdn.net/thumb.jpg");
    }

    @Test
    @DisplayName("프로필 이미지가 모두 없을 때 null을 반환한다")
    void shouldReturnNullWhenNoProfileImages() {
        // given
        Map<String, Object> profile = new HashMap<>();
        profile.put("nickname", "홍길동");
        // 이미지 URL들이 없음

        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "hong@example.com");
        kakaoAccount.put("profile", profile);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        attributes.put("kakao_account", kakaoAccount);

        // when
        KakaoProvider kakaoProvider = KakaoProvider.from(attributes);

        // then
        assertThat(kakaoProvider.getProfileUrl()).isNull();
    }

    @Test
    @DisplayName("이메일이 없을 때 예외가 발생한다")
    void shouldThrowExceptionWhenEmailNotAvailable() {
        // given
        Map<String, Object> profile = new HashMap<>();
        profile.put("nickname", "홍길동");

        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("profile", profile);
        // email 없음

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        attributes.put("kakao_account", kakaoAccount);

        // when
        KakaoProvider kakaoProvider = KakaoProvider.from(attributes);

        // then
        assertThatThrownBy(() -> kakaoProvider.getEmail())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Kakao OAuth2에서 이메일 정보를 가져올 수 없습니다.");
    }

    @Test
    @DisplayName("카카오 계정 정보가 없을 때 예외가 발생한다")
    void shouldThrowExceptionWhenKakaoAccountMissing() {
        // given
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        // kakao_account 없음

        // when & then
        assertThatThrownBy(() -> KakaoProvider.from(attributes))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("kakao_account 정보를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("프로필 정보가 없을 때 예외가 발생한다")
    void shouldThrowExceptionWhenProfileMissing() {
        // given
        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "hong@example.com");
        // profile 없음

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", 12345L);
        attributes.put("kakao_account", kakaoAccount);

        // when & then
        assertThatThrownBy(() -> KakaoProvider.from(attributes))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("profile 정보를 찾을 수 없습니다.");
    }
} 