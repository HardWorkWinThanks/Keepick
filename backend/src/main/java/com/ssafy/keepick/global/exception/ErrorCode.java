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

    // Group
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 그룹입니다.", "G001"),

    // Group_Member
    INVITATION_DUPLICATE(HttpStatus.CONFLICT, "이미 그룹에 가입한 회원입니다", "GM001"),
    INVITATION_NOT_FOUND(HttpStatus.FORBIDDEN, "그룹 초대 요청을 찾을 수 없습니다", "GM002"),
    INVITATION_TOKEN_NOT_FOUND(HttpStatus.FORBIDDEN, "유효하지 않거나 만료된 링크입니다.", "GM003"),

    // Friend
    FRIENDSHIP_FORBIDDEN(HttpStatus.FORBIDDEN, "친구 요청을 처리할 권한이 없습니다", "F001"),
    FRIENDSHIP_NOT_FOUND(HttpStatus.NOT_FOUND, "친구 요청을 찾을 수 없습니다", "F002"),

    // 시스템 에러
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다.", "S001");

    private final HttpStatus status;
    private final String message;
    private final String code;

}
