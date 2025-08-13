package com.ssafy.keepick.member.controller;

import com.ssafy.keepick.member.controller.request.MemberUpdateRequest;
import com.ssafy.keepick.member.controller.response.MemberInfoResponse;
import com.ssafy.keepick.member.controller.response.MemberSearchResponse;
import com.ssafy.keepick.member.controller.response.NicknameCheckResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 회원 관리 API 명세 인터페이스
 * Swagger 문서화를 위한 어노테이션들을 분리하여 컨트롤러를 깔끔하게 유지합니다.
 */
@Tag(name = "회원 관리", description = "회원 정보 조회 및 수정 관련 API")
@SecurityRequirement(name = "accessToken")
public interface MemberApiSpec {

    @Operation(
        summary = "내 정보 조회",
        description = """
            현재 로그인된 사용자의 상세 정보를 조회합니다.
            
            🔐 인증 필요:
            - Authorization 헤더에 Bearer JWT 토큰이 필요합니다
            
            📋 반환 정보:
            - memberId: 회원 고유 ID
            - nickname: 닉네임
            - profileUrl: 프로필 이미지 URL
            - email: 이메일 주소
            - provider: 소셜 로그인 제공자 (kakao, google, naver)
            - identificationUrl: AI 식별용 이미지 URL (선택사항)
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "조회 성공",
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
                            "memberId": 1,
                            "nickname": "홍길동",
                            "profileUrl": "https://example.com/profile.jpg",
                            "email": "user@example.com",
                            "provider": "kakao",
                            "identificationUrl": "https://example.com/identification.jpg"
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
                    name = "토큰 없음",
                    value = """
                    {
                        "status": 401,
                        "message": "인증이 필요합니다.",
                        "errorCode": "B001",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<MemberInfoResponse> getCurrentMemberInfo();

    @Operation(
        summary = "내 정보 수정",
        description = """
            현재 로그인된 사용자의 정보를 수정합니다.
            
            🔐 인증 필요:
            - Authorization 헤더에 Bearer JWT 토큰이 필요합니다
            
            📝 수정 가능한 필드:
            - nickname: 닉네임 (선택사항)
            - profileUrl: 프로필 이미지 URL (선택사항)
            - identificationUrl: AI 식별용 이미지 URL (선택사항)
            
            ⚠️ 주의사항:
            - 최소 하나 이상의 필드를 수정해야 합니다
            - 수정하지 않을 필드는 null로 전송하거나 생략 가능합니다
            - 이미지 URL은 유효한 URL이어야 합니다
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "수정 성공",
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
                            "memberId": 1,
                            "nickname": "새로운닉네임",
                            "profileUrl": "https://example.com/new-profile.jpg",
                            "email": "user@example.com",
                            "provider": "kakao",
                            "identificationUrl": "https://example.com/new-identification.jpg"
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "잘못된 요청",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "수정할 내용 없음",
                    value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청 파라미터입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
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
                    name = "토큰 없음",
                    value = """
                    {
                        "status": 401,
                        "message": "인증이 필요합니다.",
                        "errorCode": "B001",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<MemberInfoResponse> updateCurrentMemberInfo(
        @Parameter(
            description = "수정할 회원 정보",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = MemberUpdateRequest.class),
                examples = @ExampleObject(
                    name = "닉네임만 수정",
                    value = """
                    {
                        "nickname": "새로운닉네임"
                    }
                    """
                )
            )
        )
        MemberUpdateRequest request
    );

    @Operation(
        summary = "닉네임으로 회원 검색",
        description = """
            닉네임으로 사용자를 검색합니다.
            
            🔍 검색 기능:
            - 정확한 닉네임 매칭으로 검색합니다
            - 대소문자를 구분하지 않습니다
            
            📋 반환 정보:
            - memberId: 회원 고유 ID
            - nickname: 닉네임
            - profileUrl: 프로필 이미지 URL
            
            ⚠️ 주의사항:
            - 검색 결과가 없으면 404 에러를 반환합니다
            - 본인 정보도 검색 가능합니다
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "검색 성공",
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
                            "memberId": 2,
                            "nickname": "김철수",
                            "profileUrl": "https://example.com/profile2.jpg"
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", 
            description = "회원을 찾을 수 없음",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "회원 없음",
                    value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 회원입니다.",
                        "errorCode": "M001",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "잘못된 요청",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "닉네임 누락",
                    value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청 파라미터입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<MemberSearchResponse> searchMemberByNickname(
        @Parameter(
            description = "검색할 닉네임 (필수)",
            required = true,
            example = "홍길동"
        )
        String nickname
    );

    @Operation(
        summary = "닉네임 중복검사",
        description = """
            닉네임의 사용 가능 여부를 확인합니다.
            
            🔍 검사 기능:
            - 입력된 닉네임이 이미 사용 중인지 확인합니다
            - 대소문자를 구분하지 않습니다
            
            📋 반환 정보:
            - available: 사용 가능 여부 (true: 사용 가능, false: 이미 사용 중)
            - nickname: 검사한 닉네임
            
            ⚠️ 주의사항:
            - 닉네임은 필수 파라미터입니다
            - 빈 문자열이나 공백만 있는 닉네임은 유효하지 않습니다
            """
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "검사 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = {
                    @ExampleObject(
                        name = "사용 가능한 닉네임",
                        value = """
                        {
                            "status": 200,
                            "message": "요청이 성공적으로 처리되었습니다.",
                            "data": {
                                "available": true,
                                "nickname": "새로운닉네임"
                            }
                        }
                        """
                    ),
                    @ExampleObject(
                        name = "이미 사용 중인 닉네임",
                        value = """
                        {
                            "status": 200,
                            "message": "요청이 성공적으로 처리되었습니다.",
                            "data": {
                                "available": false,
                                "nickname": "기존닉네임"
                            }
                        }
                        """
                    )
                }
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "잘못된 요청",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class),
                examples = @ExampleObject(
                    name = "닉네임 누락",
                    value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청 파라미터입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-10T15:17:08.797705800"
                    }
                    """
                )
            )
        )
    })
    ApiResponse<NicknameCheckResponse> checkNicknameAvailability(
        @Parameter(
            description = "검사할 닉네임 (필수)",
            required = true,
            example = "새로운닉네임"
        )
        String nickname
    );
}
