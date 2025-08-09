package com.ssafy.keepick.auth.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import com.ssafy.keepick.support.BaseTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ssafy.keepick.auth.application.MobileLoginService;
import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MobileAuthControllerTest extends BaseTest {

    @Mock
    private MobileLoginService mobileLoginService;

    @InjectMocks
    private MobileAuthController mobileAuthController;

    @Test
    void login_Success() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "valid-token");
        MobileLoginResponse mockResponse = MobileLoginResponse.of("jwt-token");
        
        given(mobileLoginService.login(any(MobileLoginRequest.class))).willReturn(mockResponse);

        // when
        ApiResponse<MobileLoginResponse> response = mobileAuthController.login(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getData().getAccessToken()).isEqualTo("jwt-token");
        verify(mobileLoginService).login(any(MobileLoginRequest.class));
    }
    
    @Test
    void login_UnsupportedProvider_ThrowsException() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("facebook", "token");
        
        given(mobileLoginService.login(any(MobileLoginRequest.class)))
                .willThrow(new BaseException(ErrorCode.UNSUPPORTED_OAUTH2_PROVIDER, "지원하지 않는 OAuth2 제공자"));

        // when & then
        assertThatThrownBy(() -> mobileAuthController.login(request))
                .isInstanceOf(BaseException.class);
                
        verify(mobileLoginService).login(any(MobileLoginRequest.class));
    }
    
    @Test 
    void login_OAuth2AuthenticationFailed_ThrowsException() {
        // given
        MobileLoginRequest request = new MobileLoginRequest("google", "invalid-token");
        
        given(mobileLoginService.login(any(MobileLoginRequest.class)))
                .willThrow(new BaseException(ErrorCode.OAUTH2_AUTHENTICATION_FAILED, "OAuth2 인증 실패"));

        // when & then
        assertThatThrownBy(() -> mobileAuthController.login(request))
                .isInstanceOf(BaseException.class);
                
        verify(mobileLoginService).login(any(MobileLoginRequest.class));
    }
}