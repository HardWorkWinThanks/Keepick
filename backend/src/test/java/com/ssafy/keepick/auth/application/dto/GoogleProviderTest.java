package com.ssafy.keepick.auth.application.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class GoogleProviderTest {

    @Test
    @DisplayName("구글 사용자 정보가 정상적으로 파싱된다")
    void shouldParseGoogleUserInfoCorrectly() {
        // given
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-user-id");
        attributes.put("name", "홍길동");
        attributes.put("email", "hong@gmail.com");
        attributes.put("picture", "https://lh3.googleusercontent.com/profile.jpg");

        // when
        GoogleProvider googleProvider = new GoogleProvider(attributes);

        // then
        assertThat(googleProvider.getProvider()).isEqualTo("google");
        assertThat(googleProvider.getProviderId()).isEqualTo("google-user-id");
        assertThat(googleProvider.getName()).isEqualTo("홍길동");
        assertThat(googleProvider.getEmail()).isEqualTo("hong@gmail.com");
        assertThat(googleProvider.getProfileUrl()).isEqualTo("https://lh3.googleusercontent.com/profile.jpg");
    }

    @Test
    @DisplayName("프로필 이미지가 없을 때 null을 반환한다")
    void shouldReturnNullWhenPictureNotAvailable() {
        // given
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "google-user-id");
        attributes.put("name", "홍길동");
        attributes.put("email", "hong@gmail.com");
        // picture 없음

        // when
        GoogleProvider googleProvider = new GoogleProvider(attributes);

        // then
        assertThat(googleProvider.getProfileUrl()).isNull();
    }
} 