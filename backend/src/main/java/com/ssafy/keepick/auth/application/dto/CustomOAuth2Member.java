package com.ssafy.keepick.auth.application.dto;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class CustomOAuth2Member implements OAuth2User {

    private MemberDto memberDto;

    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(memberDto.getRole()));
        return authorities;
    }

    @Override
    public String getName() {
        return memberDto.getName();
    }

    public String getUsername() {
        return memberDto.getUsername();
    }

    public Long getMemberId() {
        return memberDto.getMemberId();
    }

}
