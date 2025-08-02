package com.ssafy.keepick.auth.application;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.application.dto.CustomOAuth2Member;
import com.ssafy.keepick.auth.application.dto.GoogleProvider;
import com.ssafy.keepick.auth.application.dto.KakaoProvider;
import com.ssafy.keepick.auth.application.dto.MemberDto;
import com.ssafy.keepick.auth.application.dto.NaverProvider;
import com.ssafy.keepick.auth.application.dto.OAuth2Provider;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.persistence.MemberRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CustomOAuth2MemberService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        System.out.println(oAuth2User);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2Provider oAuth2Response = null;
        if (registrationId.equals("naver")) {

            oAuth2Response = NaverProvider.from(oAuth2User.getAttributes());
        } else if (registrationId.equals("google")) {

            oAuth2Response = GoogleProvider.from(oAuth2User.getAttributes());
        } else if (registrationId.equals("kakao")) {

            oAuth2Response = KakaoProvider.from(oAuth2User.getAttributes());
        } else {
            return null;
        }

        String email = oAuth2Response.getEmail();
        Member existMember = memberRepository.findByEmail(email);

        // 존재하지 않는 회원이면 회원 생성
        if (existMember == null) {

            String nickname = generateNicknameFromEmail(email);
            
            Member member = Member.builder()
            .name(oAuth2Response.getName())
            .email(email)
            .nickname(nickname)
            .profileUrl(oAuth2Response.getProfileUrl())
            .provider(oAuth2Response.getProvider())
            .providerId(oAuth2Response.getProviderId())
            .build();

            Member savedMember = memberRepository.save(member); // 저장된 회원 정보 받기

            MemberDto memberDto = MemberDto.from(savedMember);

            return CustomOAuth2Member.from(memberDto);
        }
        // 존재하는 회원이면 기존 정보 그대로 사용
        else {
            MemberDto memberDto = MemberDto.from(existMember);

            return CustomOAuth2Member.from(memberDto);
        }
    }

    // 이메일 주소에서 닉네임을 자동 생성합니다.
    private String generateNicknameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new RuntimeException("유효하지 않은 이메일 형식입니다: " + email);
        }

        String nicknameCandidate = email.substring(0, email.indexOf("@"));
        
        if (nicknameCandidate.trim().isEmpty()) {
            throw new RuntimeException("이메일에서 닉네임을 생성할 수 없습니다: " + email);
        }

        return nicknameCandidate;
    }
}