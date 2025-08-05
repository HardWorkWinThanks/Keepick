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
    void updateProfile_WhenProfileChanged_ShouldUpdateSuccessfully() {
        // given
        String newNickname = "새닉네임";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        member.updateProfile(newNickname, newProfileUrl, null);

        // then
        assertThat(member.getNickname()).isEqualTo(newNickname);
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("닉네임만 변경되었을 때 업데이트가 정상적으로 수행된다")
    void updateProfile_WhenOnlyNicknameChanged_ShouldUpdateSuccessfully() {
        // given
        String newNickname = "새닉네임";
        String sameProfileUrl = "https://old-profile.jpg";

        // when
        member.updateProfile(newNickname, sameProfileUrl, null);

        // then
        assertThat(member.getNickname()).isEqualTo(newNickname);
        assertThat(member.getProfileUrl()).isEqualTo(sameProfileUrl);
    }

    @Test
    @DisplayName("프로필 URL만 변경되었을 때 업데이트가 정상적으로 수행된다")
    void updateProfile_WhenOnlyProfileUrlChanged_ShouldUpdateSuccessfully() {
        // given
        String sameNickname = "hong";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        member.updateProfile(sameNickname, newProfileUrl, null);

        // then
        assertThat(member.getNickname()).isEqualTo(sameNickname);
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("프로필 정보가 변경되지 않았을 때도 정상 처리된다")
    void updateProfile_WhenNoChange_ShouldHandleGracefully() {
        // given
        String sameNickname = "hong";
        String sameProfileUrl = "https://old-profile.jpg";

        // when
        member.updateProfile(sameNickname, sameProfileUrl, null);

        // then
        assertThat(member.getNickname()).isEqualTo(sameNickname);
        assertThat(member.getProfileUrl()).isEqualTo(sameProfileUrl);
    }

    @Test
    @DisplayName("새로운 프로필 URL이 null일 때 정상적으로 처리된다")
    void updateProfile_WhenNewProfileUrlIsNull_ShouldHandle() {
        // given
        String sameNickname = "hong";
        String nullProfileUrl = null;

        // when
        member.updateProfile(sameNickname, nullProfileUrl, null);

        // then 
        assertThat(member.getProfileUrl()).isNull();
    }

    @Test
    @DisplayName("기존 프로필 URL이 null이고 새로운 URL이 있을 때 업데이트된다")
    void updateProfile_WhenExistingProfileUrlIsNull_ShouldUpdate() {
        // given
        Member memberWithNullProfile = Member.builder()
                .name("홍길동")
                .email("test@example.com")
                .nickname("hong")
                .profileUrl(null)
                .provider("kakao")
                .providerId("12345")
                .build();
        
        String sameNickname = "hong";
        String newProfileUrl = "https://new-profile.jpg";

        // when
        memberWithNullProfile.updateProfile(sameNickname, newProfileUrl, null);

        // then
        assertThat(memberWithNullProfile.getProfileUrl()).isEqualTo(newProfileUrl);
    }

    @Test
    @DisplayName("이름이 null일 때 업데이트되지 않는다")
    void updateProfile_WhenNameIsNull_ShouldNotUpdateName() {
        // given
        String originalNickname = member.getNickname();
        String nullNickname = null;
        String newProfileUrl = "https://new-profile.jpg";

        // when
        member.updateProfile(nullNickname, newProfileUrl, null);

        // then
        assertThat(member.getNickname()).isEqualTo(originalNickname); // 닉네임은 변경되지 않음
        assertThat(member.getProfileUrl()).isEqualTo(newProfileUrl);
    }
} 