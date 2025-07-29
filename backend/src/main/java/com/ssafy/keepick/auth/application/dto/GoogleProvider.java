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
        Object sub = attributes.get("sub");
        return sub != null ? sub.toString() : null;
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
        Object picture = attributes.get("picture");
        return picture != null ? picture.toString() : null;
    }
}
