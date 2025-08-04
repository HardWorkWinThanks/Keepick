package com.ssafy.keepick.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // 기본 에러
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.", "B001"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다.", "B002"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다.", "B003"),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다.", "B004"),
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "중복된 리소스입니다.", "B005"),

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다.", "M001"),

    // Group
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 그룹입니다.", "G001"),

    // Group_Member
    INVITATION_FORBIDDEN(HttpStatus.FORBIDDEN, "초대 요청을 처리할 권한이 없습니다.", "GM001"),
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "그룹 초대 요청을 찾을 수 없습니다", "GM002"),
    INVITATION_TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "유효하지 않거나 만료된 링크입니다.", "GM003"),

    // Auth
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다.", "A001"),
    OAUTH2_AUTHENTICATION_FAILED(HttpStatus.UNAUTHORIZED, "OAuth2 인증에 실패했습니다.", "A002"),
    UNSUPPORTED_OAUTH2_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 OAuth2 제공자입니다.", "A003"),

    // 시스템 에러
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다.", "S001");

    private final HttpStatus status;
    private final String message;
    private final String code;

}
