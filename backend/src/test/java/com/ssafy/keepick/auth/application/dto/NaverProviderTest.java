package com.ssafy.keepick.auth.application.dto;

import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class NaverProviderTest extends BaseTest {

    @Test
    @DisplayName("네이버 사용자 정보가 정상적으로 파싱된다")
    void shouldParseNaverUserInfoCorrectly() {
        // given
        Map<String, Object> response = new HashMap<>();
        response.put("id", "naver-user-id");
        response.put("name", "홍길동");
        response.put("email", "hong@naver.com");
        response.put("profile_image", "https://phinf.pstatic.net/profile.jpg");

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("response", response);

        // when
        NaverProvider naverProvider = NaverProvider.from(attributes);

        // then
        assertThat(naverProvider.getProvider()).isEqualTo("naver");
        assertThat(naverProvider.getProviderId()).isEqualTo("naver-user-id");
        assertThat(naverProvider.getName()).isEqualTo("홍길동");
        assertThat(naverProvider.getEmail()).isEqualTo("hong@naver.com");
        assertThat(naverProvider.getProfileUrl()).isEqualTo("https://phinf.pstatic.net/profile.jpg");
    }

    @Test
    @DisplayName("프로필 이미지가 없을 때 null을 반환한다")
    void shouldReturnNullWhenProfileImageNotAvailable() {
        // given
        Map<String, Object> response = new HashMap<>();
        response.put("id", "naver-user-id");
        response.put("name", "홍길동");
        response.put("email", "hong@naver.com");
        // profile_image 없음

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("response", response);

        // when
        NaverProvider naverProvider = NaverProvider.from(attributes);

        // then
        assertThat(naverProvider.getProfileUrl()).isNull();
    }

    @Test
    @DisplayName("이메일이 없을 때 예외가 발생한다")
    void shouldThrowExceptionWhenEmailNotAvailable() {
        // given
        Map<String, Object> response = new HashMap<>();
        response.put("id", "naver-user-id");
        response.put("name", "홍길동");
        // email 없음

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("response", response);

        // when
        NaverProvider naverProvider = NaverProvider.from(attributes);

        // then
        assertThatThrownBy(() -> naverProvider.getEmail())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Naver OAuth2에서 이메일 정보를 가져올 수 없습니다.");
    }
} 