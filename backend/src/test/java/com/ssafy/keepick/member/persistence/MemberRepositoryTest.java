package com.ssafy.keepick.member.persistence;

import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.*;

import java.util.Optional;

@DataJpaTest
class MemberRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MemberRepository memberRepository;

    @Test
    @DisplayName("회원을 정상적으로 저장한다")
    void shouldSaveMemberSuccessfully() {
        // given
        Member member = Member.builder()
                .name("홍길동")
                .email("hong@example.com")
                .nickname("hong")
                .profileUrl("https://example.com/profile.jpg")
                .provider("kakao")
                .providerId("12345")
                .build();

        // when
        Member savedMember = memberRepository.save(member);

        // then
        assertThat(savedMember).isNotNull();
        assertThat(savedMember.getId()).isNotNull();
        assertThat(savedMember.getName()).isEqualTo("홍길동");
        assertThat(savedMember.getEmail()).isEqualTo("hong@example.com");
        assertThat(savedMember.getNickname()).isEqualTo("hong");
        assertThat(savedMember.getProfileUrl()).isEqualTo("https://example.com/profile.jpg");
        assertThat(savedMember.getProvider()).isEqualTo("kakao");
        assertThat(savedMember.getProviderId()).isEqualTo("12345");
        assertThat(savedMember.getCreatedAt()).isNotNull();
        assertThat(savedMember.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("이메일로 회원을 조회한다")
    void shouldFindMemberByEmail() {
        // given
        Member member = Member.builder()
                .name("김길동")
                .email("kim@example.com")
                .nickname("kim")
                .profileUrl("https://example.com/kim.jpg")
                .provider("google")
                .providerId("google123")
                .build();
        
        entityManager.persistAndFlush(member);

        // when
        Optional<Member> foundMemberOpt = memberRepository.findByEmail("kim@example.com");

        // then
        assertThat(foundMemberOpt).isPresent();
        Member foundMember = foundMemberOpt.get();
        assertThat(foundMember.getName()).isEqualTo("김길동");
        assertThat(foundMember.getEmail()).isEqualTo("kim@example.com");
        assertThat(foundMember.getProvider()).isEqualTo("google");
        assertThat(foundMember.getProviderId()).isEqualTo("google123");
    }

    @Test
    @DisplayName("존재하지 않는 이메일로 조회 시 빈 Optional을 반환한다")
    void shouldReturnEmptyOptionalWhenEmailNotFound() {
        // when
        Optional<Member> foundMemberOpt = memberRepository.findByEmail("notfound@example.com");

        // then
        assertThat(foundMemberOpt).isEmpty();
    }

    @Test
    @DisplayName("회원 정보를 업데이트한다")
    void shouldUpdateMemberSuccessfully() {
        // given
        Member member = Member.builder()
                .name("이길동")
                .email("lee@example.com")
                .nickname("lee")
                .profileUrl("https://example.com/old.jpg")
                .provider("naver")
                .providerId("naver456")
                .build();
        
        Member savedMember = entityManager.persistAndFlush(member);
        Long memberId = savedMember.getId();

        // when
        savedMember.updateProfile("새닉네임", "https://example.com/new.jpg", null);
        entityManager.flush();
        entityManager.clear(); // 영속성 컨텍스트 클리어

        // then
        Member updatedMember = memberRepository.findById(memberId).orElse(null);
        assertThat(updatedMember).isNotNull();
        assertThat(updatedMember.getNickname()).isEqualTo("새닉네임");
        assertThat(updatedMember.getProfileUrl()).isEqualTo("https://example.com/new.jpg");
        assertThat(updatedMember.getUpdatedAt()).isAfter(updatedMember.getCreatedAt());
    }

    @Test
    @DisplayName("같은 이메일로 중복 저장 시 예외가 발생한다")
    void shouldThrowExceptionWhenDuplicateEmail() {
        // given
        Member member1 = Member.builder()
                .name("첫번째")
                .email("duplicate@example.com")
                .nickname("first")
                .profileUrl("https://example.com/first.jpg")
                .provider("kakao")
                .providerId("kakao1")
                .build();

        Member member2 = Member.builder()
                .name("두번째")
                .email("duplicate@example.com") // 같은 이메일
                .nickname("second")
                .profileUrl("https://example.com/second.jpg")
                .provider("google")
                .providerId("google2")
                .build();

        // when
        memberRepository.save(member1);
        entityManager.flush();

        // then
        assertThatThrownBy(() -> {
            memberRepository.save(member2);
            entityManager.flush();
        }).isInstanceOf(Exception.class); // 제약 조건 위반으로 예외 발생
    }

    @Test
    @DisplayName("프로필 URL이 null인 회원도 정상적으로 저장된다")
    void shouldSaveMemberWithNullProfileUrl() {
        // given
        Member member = Member.builder()
                .name("박길동")
                .email("park@example.com")
                .nickname("park")
                .profileUrl(null) // null 프로필 URL
                .provider("kakao")
                .providerId("kakao789")
                .build();

        // when
        Member savedMember = memberRepository.save(member);

        // then
        assertThat(savedMember).isNotNull();
        assertThat(savedMember.getProfileUrl()).isNull();
        assertThat(savedMember.getName()).isEqualTo("박길동");
    }
    
    @Test
    @DisplayName("닉네임으로 회원을 조회한다")
    void shouldFindMemberByNickname() {
        // given
        Member member = Member.builder()
                .name("닉네임테스트")
                .email("nickname@example.com")
                .nickname("테스트닉네임")
                .profileUrl("https://example.com/nickname.jpg")
                .provider("kakao")
                .providerId("nickname123")
                .build();
        
        entityManager.persistAndFlush(member);

        // when
        Optional<Member> foundMemberOpt = memberRepository.findByNickname("테스트닉네임");

        // then
        assertThat(foundMemberOpt).isPresent();
        Member foundMember = foundMemberOpt.get();
        assertThat(foundMember.getName()).isEqualTo("닉네임테스트");
        assertThat(foundMember.getNickname()).isEqualTo("테스트닉네임");
        assertThat(foundMember.getEmail()).isEqualTo("nickname@example.com");
        assertThat(foundMember.getProfileUrl()).isEqualTo("https://example.com/nickname.jpg");
    }
    
    @Test
    @DisplayName("존재하지 않는 닉네임으로 조회 시 빈 Optional을 반환한다")
    void shouldReturnEmptyOptionalWhenNicknameNotFound() {
        // when
        Optional<Member> foundMemberOpt = memberRepository.findByNickname("존재하지않는닉네임");

        // then
        assertThat(foundMemberOpt).isEmpty();
    }
    
    @Test
    @DisplayName("프로필 URL이 null인 회원도 닉네임으로 조회된다")
    void shouldFindMemberByNicknameWithNullProfileUrl() {
        // given
        Member member = Member.builder()
                .name("널프로필")
                .email("nullprofile@example.com")
                .nickname("널프로필닉네임")
                .profileUrl(null)
                .provider("google")
                .providerId("nullprofile456")
                .build();
        
        entityManager.persistAndFlush(member);

        // when
        Optional<Member> foundMemberOpt = memberRepository.findByNickname("널프로필닉네임");

        // then
        assertThat(foundMemberOpt).isPresent();
        Member foundMember = foundMemberOpt.get();
        assertThat(foundMember.getNickname()).isEqualTo("널프로필닉네임");
        assertThat(foundMember.getProfileUrl()).isNull();
    }
} 