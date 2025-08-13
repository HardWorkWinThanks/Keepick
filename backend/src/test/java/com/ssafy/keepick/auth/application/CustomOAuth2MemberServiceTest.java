package com.ssafy.keepick.auth.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.member.persistence.MemberRepository;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private MemberService memberService;

    @Mock
    private OAuth2UserRequest userRequest;

    @Mock
    private ClientRegistration clientRegistration;

    @InjectMocks
    private CustomOAuth2MemberService oAuth2MemberService;

    @BeforeEach
    void setUp() {
        given(userRequest.getClientRegistration()).willReturn(clientRegistration);
    }

    @Test
    @DisplayName("새로운 회원 소셜 로그인 - 고유한 닉네임 생성")
    void loadUser_NewMember_GenerateUniqueNickname() {
        // given
        String email = "test@example.com";
        String uniqueNickname = "test123";
        String provider = "google";
        
        given(clientRegistration.getRegistrationId()).willReturn(provider);
        
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "123456789");
        attributes.put("name", "Test User");
        attributes.put("email", email);
        attributes.put("picture", "https://example.com/profile.jpg");
        
        OAuth2User oAuth2User = new DefaultOAuth2User(null, attributes, "sub");
        
        // 기존 회원이 존재하지 않음
        given(memberRepository.findByEmail(email)).willReturn(Optional.empty());
        
        // 고유한 닉네임 생성
        given(memberService.generateUniqueNicknameFromEmail(email)).willReturn(uniqueNickname);
        
        // 회원 저장
        Member savedMember = Member.builder()
                .name("Test User")
                .email(email)
                .nickname(uniqueNickname)
                .profileUrl("https://example.com/profile.jpg")
                .provider(provider)
                .providerId("123456789")
                .build();
        given(memberRepository.save(any(Member.class))).willReturn(savedMember);

        // when
        OAuth2User result = oAuth2MemberService.loadUser(userRequest);

        // then
        assertThat(result).isNotNull();
        verify(memberService).generateUniqueNicknameFromEmail(email);
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    @DisplayName("기존 회원 소셜 로그인 - 기존 정보 사용")
    void loadUser_ExistingMember_UseExistingInfo() {
        // given
        String email = "existing@example.com";
        String provider = "google";
        
        given(clientRegistration.getRegistrationId()).willReturn(provider);
        
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", "123456789");
        attributes.put("name", "Existing User");
        attributes.put("email", email);
        attributes.put("picture", "https://example.com/profile.jpg");
        
        OAuth2User oAuth2User = new DefaultOAuth2User(null, attributes, "sub");
        
        // 기존 회원이 존재함
        Member existingMember = Member.builder()
                .name("Existing User")
                .email(email)
                .nickname("existing")
                .profileUrl("https://example.com/profile.jpg")
                .provider(provider)
                .providerId("123456789")
                .build();
        given(memberRepository.findByEmail(email)).willReturn(Optional.of(existingMember));

        // when
        OAuth2User result = oAuth2MemberService.loadUser(userRequest);

        // then
        assertThat(result).isNotNull();
        verify(memberService, never()).generateUniqueNicknameFromEmail(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("지원하지 않는 OAuth2 제공자")
    void loadUser_UnsupportedProvider() {
        // given
        given(clientRegistration.getRegistrationId()).willReturn("unsupported");
        
        Map<String, Object> attributes = new HashMap<>();
        OAuth2User oAuth2User = new DefaultOAuth2User(null, attributes, "sub");

        // when
        OAuth2User result = oAuth2MemberService.loadUser(userRequest);

        // then
        assertThat(result).isNull();
        verify(memberRepository, never()).findByEmail(anyString());
        verify(memberService, never()).generateUniqueNicknameFromEmail(anyString());
    }
}
