package com.ssafy.keepick.testconfig;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return Mockito.mock(SecurityFilterChain.class);
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return Mockito.mock(ClientRegistrationRepository.class);
    }

    @Bean
    public OAuth2AuthorizedClientService authorizedClientService() {
        return Mockito.mock(OAuth2AuthorizedClientService.class);
    }

    @Bean
    public AuthenticationSuccessHandler successHandler() {
        return Mockito.mock(AuthenticationSuccessHandler.class);
    }

}
