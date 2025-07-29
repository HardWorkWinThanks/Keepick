package com.ssafy.keepick.auth.application.dto;

import java.util.Map;

public class KakaoProvider implements OAuth2Provider {
    private final Map<String, Object> attributes;
    private final Map<String, Object> kakaoAccount;
    private final Map<String, Object> profile;

    public KakaoProvider(Map<String, Object> attributes) {
        this.attributes = attributes;
        
        this.kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        if (this.kakaoAccount == null) {
            throw new RuntimeException("kakao_account 정보를 찾을 수 없습니다.");
        }
        
        this.profile = (Map<String, Object>) kakaoAccount.get("profile");
        if (this.profile == null) {
            throw new RuntimeException("profile 정보를 찾을 수 없습니다.");
        }
    }

    @Override
    public String getProvider() {
        return "kakao";
    }

    @Override
    public String getProviderId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getEmail() {
        Object email = kakaoAccount.get("email");
        return email != null ? email.toString() : null;
    }

    @Override
    public String getName() {
        Object nickname = profile.get("nickname");
        return nickname != null ? nickname.toString() : null;
    }

    @Override
    public String getProfileUrl() {
        // profile_image_url 먼저 확인 (고해상도)
        Object profileImageUrl = profile.get("profile_image_url");
        if (profileImageUrl != null) {
            return profileImageUrl.toString();
        }
        
        // thumbnail_image_url 확인 (저해상도)
        Object thumbnailImageUrl = profile.get("thumbnail_image_url");
        if (thumbnailImageUrl != null) {
            return thumbnailImageUrl.toString();
        }
        
        return null;
    }
}
