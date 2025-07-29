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

            oAuth2Response = new NaverProvider(oAuth2User.getAttributes());
        } else if (registrationId.equals("google")) {

            oAuth2Response = new GoogleProvider(oAuth2User.getAttributes());
        } else if (registrationId.equals("kakao")) {

            oAuth2Response = new KakaoProvider(oAuth2User.getAttributes());
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

            memberRepository.save(member);

            MemberDto memberDto = new MemberDto();
            memberDto.setUsername(email);
            memberDto.setName(oAuth2Response.getName());
            memberDto.setEmail(email);
            memberDto.setNickname(nickname);
            memberDto.setProfileUrl(oAuth2Response.getProfileUrl());
            memberDto.setProvider(oAuth2Response.getProvider());
            memberDto.setProviderId(oAuth2Response.getProviderId());
            memberDto.setRole("ROLE_USER");

            return new CustomOAuth2Member(memberDto);
        }
        // 존재하는 회원이면 회원 정보 반환
        else {
            MemberDto memberDto = new MemberDto();
            memberDto.setUsername(existMember.getEmail());
            memberDto.setName(existMember.getName());
            memberDto.setEmail(existMember.getEmail());
            memberDto.setNickname(existMember.getNickname());
            memberDto.setProfileUrl(existMember.getProfileUrl());
            memberDto.setProvider(existMember.getProvider());
            memberDto.setProviderId(existMember.getProviderId());
            memberDto.setRole("ROLE_USER");

            return new CustomOAuth2Member(memberDto);
        }
    }

    /**
     * 이메일 주소에서 닉네임을 자동 생성합니다.
     * 예시: "user@gmail.com" → "user"
     * 
     * @param email 이메일 주소
     * @return @ 앞부분으로 생성된 닉네임
     */
    private String generateNicknameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "user"; // 기본값
        }

        String nicknameCandidate = email.substring(0, email.indexOf("@"));

        // 빈 문자열이면 기본값 반환
        if (nicknameCandidate.trim().isEmpty()) {
            return "user";
        }

        return nicknameCandidate;
    }
}