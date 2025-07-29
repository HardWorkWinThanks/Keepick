package com.ssafy.keepick.member.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class MemberTest {

    private Member member;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .name("홍길동")
                .email("test@example.com")
                .nickname("hong")
                .profileUrl("https://old-profile.jpg")
                .provider("kakao")
                .providerId("12345")
                .build();
    }

    @Test
    @DisplayName("프로필 정보가 변경되었을 때 업데이트가 정상적으로 수행된다")
    void updateSocialProfile_WhenProfileChanged_ShouldReturnTrue() {
        // given
        String newName = "김길동";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        boolean result = member.updateSocialProfile(newName, newProfileUrl);

        // then
        assertThat(result).isTrue();
        assertThat(member.getName()).isEqualTo(newName);
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("이름만 변경되었을 때 업데이트가 정상적으로 수행된다")
    void updateSocialProfile_WhenOnlyNameChanged_ShouldReturnTrue() {
        // given
        String newName = "김길동";
        String sameProfileUrl = "https://old-profile.jpg";

        // when
        boolean result = member.updateSocialProfile(newName, sameProfileUrl);

        // then
        assertThat(result).isTrue();
        assertThat(member.getName()).isEqualTo(newName);
        assertThat(member.getProfileUrl()).isEqualTo(sameProfileUrl);
    }

    @Test
    @DisplayName("프로필 URL만 변경되었을 때 업데이트가 정상적으로 수행된다")
    void updateSocialProfile_WhenOnlyProfileUrlChanged_ShouldReturnTrue() {
        // given
        String sameName = "홍길동";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        boolean result = member.updateSocialProfile(sameName, newProfileUrl);

        // then
        assertThat(result).isTrue();
        assertThat(member.getName()).isEqualTo(sameName);
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("프로필 정보가 변경되지 않았을 때 업데이트되지 않는다")
    void updateSocialProfile_WhenNoChange_ShouldReturnFalse() {
        // given
        String sameName = "홍길동";
        String sameProfileUrl = "https://old-profile.jpg";

        // when
        boolean result = member.updateSocialProfile(sameName, sameProfileUrl);

        // then
        assertThat(result).isFalse();
        assertThat(member.getName()).isEqualTo(sameName);
        assertThat(member.getProfileUrl()).isEqualTo(sameProfileUrl);
    }

    @Test
    @DisplayName("새로운 프로필 URL이 null일 때 정상적으로 처리된다")
    void updateSocialProfile_WhenNewProfileUrlIsNull_ShouldHandle() {
        // given
        String sameName = "홍길동";
        String nullProfileUrl = null;

        // when
        boolean result = member.updateSocialProfile(sameName, nullProfileUrl);

        // then
        assertThat(result).isTrue(); // 기존에 값이 있었으므로 변경됨
        assertThat(member.getProfileUrl()).isNull();
    }

    @Test
    @DisplayName("기존 프로필 URL이 null이고 새로운 URL이 있을 때 업데이트된다")
    void updateSocialProfile_WhenExistingProfileUrlIsNull_ShouldUpdate() {
        // given
        Member memberWithNullProfile = Member.builder()
                .name("홍길동")
                .email("test@example.com")
                .nickname("hong")
                .profileUrl(null)
                .provider("kakao")
                .providerId("12345")
                .build();
        
        String sameName = "홍길동";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        boolean result = memberWithNullProfile.updateSocialProfile(sameName, newProfileUrl);

        // then
        assertThat(result).isTrue();
        assertThat(memberWithNullProfile.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("이름이 null일 때 업데이트되지 않는다")
    void updateSocialProfile_WhenNameIsNull_ShouldNotUpdateName() {
        // given
        String originalName = member.getName();
        String nullName = null;
        String newProfileUrl = "https://new-profile.jpg";

        // when
        boolean result = member.updateSocialProfile(nullName, newProfileUrl);

        // then
        assertThat(result).isTrue(); // 프로필 URL은 변경됨
        assertThat(member.getName()).isEqualTo(originalName); // 이름은 변경되지 않음
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }
} 