package com.ssafy.keepick.member.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.ssafy.keepick.member.application.MemberService;
import com.ssafy.keepick.support.BaseTest;

@ExtendWith(MockitoExtension.class)
class MemberControllerIntegrationTest extends BaseTest {

    private MockMvc mockMvc;

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(memberController)
                .setControllerAdvice(new com.ssafy.keepick.global.exception.GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("닉네임 중복검사 API 통합 테스트 - 사용 가능한 닉네임")
    void checkNicknameAvailability_Integration_Success_Available() throws Exception {
        // given
        String nickname = "새로운닉네임";
        given(memberService.checkNicknameAvailability(nickname)).willReturn(true);

        // when & then
        mockMvc.perform(get("/api/members/check-nickname")
                        .param("nickname", nickname)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.nickname").value(nickname))
                .andExpect(jsonPath("$.data.available").value(true));
        
        verify(memberService).checkNicknameAvailability(nickname);
    }

    @Test
    @DisplayName("닉네임 중복검사 API 통합 테스트 - 파라미터 누락")
    void checkNicknameAvailability_Integration_MissingParameter() throws Exception {
        // when & then
        mockMvc.perform(get("/api/members/check-nickname")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("닉네임은 필수입니다."))
                .andExpect(jsonPath("$.errorCode").value("B004"));
    }

    @Test
    @DisplayName("닉네임 중복검사 API 통합 테스트 - 빈 파라미터")
    void checkNicknameAvailability_Integration_EmptyParameter() throws Exception {
        // when & then
        mockMvc.perform(get("/api/members/check-nickname")
                        .param("nickname", "")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("닉네임은 필수입니다."))
                .andExpect(jsonPath("$.errorCode").value("B004"));
    }

    @Test
    @DisplayName("닉네임 중복검사 API 통합 테스트 - 공백만 있는 파라미터")
    void checkNicknameAvailability_Integration_BlankParameter() throws Exception {
        // when & then
        mockMvc.perform(get("/api/members/check-nickname")
                        .param("nickname", "   ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("닉네임은 필수입니다."))
                .andExpect(jsonPath("$.errorCode").value("B004"));
    }

    @Test
    @DisplayName("닉네임 중복검사 API 통합 테스트 - 이미 사용 중인 닉네임")
    void checkNicknameAvailability_Integration_NotAvailable() throws Exception {
        // given
        String nickname = "기존닉네임";
        given(memberService.checkNicknameAvailability(nickname)).willReturn(false);

        // when & then
        mockMvc.perform(get("/api/members/check-nickname")
                        .param("nickname", nickname)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.nickname").value(nickname))
                .andExpect(jsonPath("$.data.available").value(false));
        
        verify(memberService).checkNicknameAvailability(nickname);
    }
}
