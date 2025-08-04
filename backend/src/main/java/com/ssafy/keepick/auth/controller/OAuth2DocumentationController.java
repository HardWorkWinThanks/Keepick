package com.ssafy.keepick.auth.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;

/**
 * OAuth2 로그인 문서화 전용 컨트롤러
 * 실제로는 Spring Security가 처리하지만, Swagger 문서화를 위해 존재합니다.
 * 
 * 주의: 이 컨트롤러의 메서드들은 실제로 호출되지 않습니다.
 * Spring Security의 OAuth2 필터가 먼저 처리합니다.
 */
@RestController
@RequestMapping("/api/oauth2/authorization")
@Tag(name = "OAuth2 인증", description = "소셜 로그인 관련 API")
public class OAuth2DocumentationController {

    @Operation(
        summary = "OAuth2 소셜 로그인",
        description = """
            지정된 제공자로 OAuth2 인증을 시작합니다.
            
            ⚠️ 주의사항:
            - Swagger UI에서는 "Try it out" 버튼으로 테스트할 수 없습니다
            - OAuth2는 브라우저 리다이렉트 기반으로 동작하기 때문입니다
            
            📋 올바른 테스트 방법:
            1. 브라우저에서 직접 접근: GET /api/oauth2/authorization/kakao
            2. 프론트엔드에서: window.location.href = '/api/oauth2/authorization/kakao'
            3. Postman에서: HTML 응답이 정상입니다 (리다이렉트 페이지)
            
            🔄 동작 흐름:
            1. 이 엔드포인트 호출
            2. OAuth2 제공자 로그인 페이지로 리다이렉트 (302)
            3. 사용자 로그인 후 /api/login/oauth2/code/{provider}로 콜백
            4. JWT 토큰 발급 및 프론트엔드로 리다이렉트
            """
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "302", description = "OAuth2 제공자 인증 페이지로 리다이렉트"),
        @ApiResponse(responseCode = "400", description = "지원하지 않는 OAuth2 제공자")
    })
    @GetMapping("/{provider}")
    public void oauthLogin(
        @Parameter(
            description = "OAuth2 제공자", 
            example = "kakao",
            schema = @io.swagger.v3.oas.annotations.media.Schema(
                allowableValues = {"kakao", "google", "naver"}
            )
        ) 
        @PathVariable String provider,
        HttpServletResponse response
    ) {
        // 이 메서드는 실제로 호출되지 않습니다.
        // Spring Security의 OAuth2LoginAuthenticationFilter가 먼저 처리합니다.
        throw new UnsupportedOperationException("이 메서드는 문서화 목적으로만 존재합니다. Spring Security가 실제 처리를 담당합니다.");
    }
}