package com.ssafy.keepick.global.security.handler;

import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.support.BaseTest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomAuthenticationEntryPoint 테스트")
class CustomAuthenticationEntryPointTest extends BaseTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private AuthenticationException authException;

    private CustomAuthenticationEntryPoint authenticationEntryPoint;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        authenticationEntryPoint = new CustomAuthenticationEntryPoint();
        responseWriter = new StringWriter();

        // Mock 설정
        given(request.getMethod()).willReturn("GET");
        given(request.getRequestURI()).willReturn("/api/groups");
        given(response.getWriter()).willReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("인증 실패 시 401 상태 코드와 JSON 응답을 반환한다")
    void shouldReturn401WithJsonResponse() throws Exception {
        // when
        authenticationEntryPoint.commence(request, response, authException);

        // then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);
        verify(response).setCharacterEncoding("UTF-8");

        // JSON 응답 내용 검증
        String jsonResponse = responseWriter.toString();
        
        assertThat(jsonResponse).isNotEmpty();
        assertThat(jsonResponse).contains("\"status\":401");
        assertThat(jsonResponse).contains("\"errorCode\":\"B001\"");
        assertThat(jsonResponse).contains("\"message\":\"인증이 필요합니다.\"");
        assertThat(jsonResponse).contains("\"timeStamp\":");
    }

    @Test
    @DisplayName("다양한 API 경로에서 일관된 401 응답을 반환한다")
    void shouldReturnConsistent401ResponseForDifferentPaths() throws Exception {
        // given
        given(request.getRequestURI()).willReturn("/api/auth/some-protected-endpoint");

        // when
        authenticationEntryPoint.commence(request, response, authException);

        // then
        String jsonResponse = responseWriter.toString();
        
        assertThat(jsonResponse).isNotEmpty();
        assertThat(jsonResponse).contains("\"status\":401");
        assertThat(jsonResponse).contains("\"errorCode\":\"B001\"");
        assertThat(jsonResponse).contains("\"message\":\"인증이 필요합니다.\"");
    }

    @Test
    @DisplayName("POST 요청에서도 동일한 401 응답을 반환한다")
    void shouldReturn401ForPostRequests() throws Exception {
        // given
        given(request.getMethod()).willReturn("POST");
        given(request.getRequestURI()).willReturn("/api/groups");

        // when
        authenticationEntryPoint.commence(request, response, authException);

        // then
        String jsonResponse = responseWriter.toString();
        
        assertThat(jsonResponse).isNotEmpty();
        assertThat(jsonResponse).contains("\"status\":401");
        assertThat(jsonResponse).contains("\"message\":\"인증이 필요합니다.\"");
    }

    @Test
    @DisplayName("응답 헤더가 올바르게 설정된다")
    void shouldSetCorrectResponseHeaders() throws Exception {
        // when
        authenticationEntryPoint.commence(request, response, authException);

        // then
        verify(response).setStatus(401);
        verify(response).setContentType("application/json");
        verify(response).setCharacterEncoding("UTF-8");
    }
}