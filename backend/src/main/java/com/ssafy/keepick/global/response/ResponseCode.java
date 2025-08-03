package com.ssafy.keepick.global.response;

import lombok.Getter;

@Getter
public enum ResponseCode {

    OK(200, "요청이 성공적으로 처리되었습니다."),
    CREATED(201, "리소스가 성공적으로 생성되었습니다."),
    UPDATED(200, "리소스가 성공적으로 수정되었습니다."),
    DELETED(200, "리소스가 성공적으로 삭제되었습니다."),
    LOGGED_IN(200, "로그인에 성공하였습니다."),
    LOGGED_OUT(200, "로그아웃에 성공하였습니다."),
    NO_CONTENT(204, "콘텐츠가 없습니다."), // 보통 body 없이 반환
    
    // 에러 코드
    UNAUTHORIZED(401, "인증이 필요합니다."),
    FORBIDDEN(403, "권한이 없습니다."),
    NOT_FOUND(404, "리소스를 찾을 수 없습니다."),
    INVALID_PARAMETER(400, "잘못된 요청 파라미터입니다."),
    DUPLICATE_RESOURCE(409, "중복된 리소스입니다."),
    INTERNAL_SERVER_ERROR(500, "서버 내부 오류입니다.");

    private final int status;
    private final String message;

    ResponseCode(int status, String message) {
        this.status = status;
        this.message = message;
    }
}