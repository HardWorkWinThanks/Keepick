package com.ssafy.keepick.auth.application.dto;

import java.util.Map;

public class NaverProvider implements OAuth2Provider {
    private final Map<String, Object> attributes;

    private NaverProvider(Map<String, Object> attributes) {
        this.attributes = (Map<String, Object>) attributes.get("response");
    }

    public static NaverProvider from(Map<String, Object> attributes) {
        return new NaverProvider(attributes);
    }

    @Override
    public String getProvider() {
        return "naver";
    }

    @Override
    public String getProviderId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getEmail() { 
        Object email = attributes.get("email");
        return email != null ? email.toString() : null;
    }

    @Override
    public String getName() {  
        Object name = attributes.get("name");
        return name != null ? name.toString() : null;
    }

    @Override
    public String getProfileUrl() {
        Object profileImage = attributes.get("profile_image");
        return profileImage != null ? profileImage.toString() : null;
    }
}
