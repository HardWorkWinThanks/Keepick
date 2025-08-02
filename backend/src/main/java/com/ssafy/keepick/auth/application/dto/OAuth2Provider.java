package com.ssafy.keepick.auth.application.dto;

public interface OAuth2Provider {
    String getProvider();
    String getProviderId();
    String getEmail();
    String getName();
    String getProfileUrl();
}
