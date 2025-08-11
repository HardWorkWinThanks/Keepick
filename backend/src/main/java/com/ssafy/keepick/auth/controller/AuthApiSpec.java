package com.ssafy.keepick.auth.controller;

import com.ssafy.keepick.auth.controller.request.MobileLoginRequest;
import com.ssafy.keepick.auth.controller.response.MobileLoginResponse;
import com.ssafy.keepick.auth.controller.response.TokenRefreshResponse;
import com.ssafy.keepick.global.exception.ErrorResponse;
import com.ssafy.keepick.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 인증 API 명세 인터페이스
 * Swagger 문서화를 위한 어노테이션들을 분리하여 컨트롤러를 깔끔하게 유지합니다.
 */
@Tag(name = "인증", description = "웹/모바일 인증 관련 API")
public interface AuthApiSpec {

    @Operation(
        summary = "모바일 로그인",
        description = """
            모바일 앱에서 소셜 로그인을 통해 받은 accessToken을 검증하고 JWT 토큰을 발급합니다.
            
            📱 지원하는 소셜 로그인:
            - kakao: 카카오 로그인
            - google: 구글 로그인  
            - naver: 네이버 로그인
            
            🔄 동작 흐름:
            1. 모바일 앱에서 소셜 로그인 수행
            2. 소셜 제공자로부터 accessToken 획득
            3. 이 API에 provider와 accessToken 전송
            4. 서버에서 토큰 검증 후 JWT 발급
            5. 발급된 JWT로 인증된 요청 수행 가능
            
            ⚠️ 주의사항:
            - provider는 소셜 로그인 제공자를 정확히 지정해야 합니다
            - accessToken은 유효한 토큰이어야 합니다
            - 발급된 JWT는 Authorization 헤더에 Bearer 토큰으로 포함해야 합니다
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "로그인 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "성공 응답 예시",
                    value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": {
                            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "잘못된 요청",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "잘못된 provider",
                    value = """
                    {
                        "status": 401,
                        "message": "OAuth2 인증에 실패했습니다.",
                        "errorCode": "A002",
                        "timeStamp": "2025-08-10T15:20:07.285856900"
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "인증 실패",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "유효하지 않은 토큰",
                    value = """
                    {
                        "status": 401,
                        "message": "OAuth2 인증에 실패했습니다.",
                        "errorCode": "A002",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "검증 실패",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "필수 필드 누락",
                    value = """
                    {
                        "status": 400,
                        "message": "provider는 필수입니다",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-10T15:19:12.848202100"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<MobileLoginResponse> login(
        @Parameter(
            description = "모바일 로그인 요청 정보",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = MobileLoginRequest.class),
                examples = @ExampleObject(
                    name = "카카오 로그인 예시",
                    value = """
                    {
                        "provider": "kakao",
                        "accessToken": "kakao_access_token_here"
                    }
                    """
                )
            )
        )
        MobileLoginRequest request
    );

    @Operation(
        summary = "토큰 갱신",
        description = """
            쿠키에 저장된 refresh_token을 검증하고 새로운 액세스 토큰을 발급합니다.
            
            🔄 동작 흐름:
            1. 클라이언트에서 쿠키에 저장된 refresh_token 확인
            2. 리프레시 토큰 검증 및 회전 (새로운 리프레시 토큰 발급)
            3. 새로운 액세스 토큰 발급
            4. 응답 본문에 새로운 액세스 토큰 반환
            5. 새로운 리프레시 토큰을 쿠키에 설정
            
            ⚠️ 주의사항:
            - 쿠키에 유효한 refresh_token이 있어야 합니다
            - 리프레시 토큰이 만료되거나 재사용된 경우 갱신할 수 없습니다
            - 새로운 액세스 토큰은 응답 본문에 포함됩니다
            - 새로운 리프레시 토큰은 HttpOnly 쿠키로 자동 설정됩니다
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "토큰 갱신 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "성공 응답 예시",
                    value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": {
                            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "인증 실패",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "토큰 없음 또는 만료",
                    value = """
                    {
                        "status": 401,
                        "message": "인증이 필요합니다.",
                        "errorCode": "B001",
                        "timeStamp": "2025-08-10T15:20:07.285856900"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<TokenRefreshResponse> refreshToken(HttpServletRequest request, HttpServletResponse response);
}
