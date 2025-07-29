package com.ssafy.keepick.auth.application.dto;

import java.util.Map;

public class GoogleProvider implements OAuth2Provider {
    private final Map<String, Object> attributes;

    public GoogleProvider(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProvider() {
        return "google";
    }

    @Override
    public String getProviderId() {
        return attributes.get("sub").toString();
    }

    @Override
    public String getEmail() {
        return attributes.get("email").toString();
    }

    @Override
    public String getName() {
        return attributes.get("name").toString();
    }

    @Override
    public String getProfileUrl() {
        return attributes.get("picture").toString();
    }
}
