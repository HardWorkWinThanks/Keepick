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
    NO_CONTENT(204, "콘텐츠가 없습니다."); // 보통 body 없이 반환

    private final int status;
    private final String message;

    ResponseCode(int status, String message) {
        this.status = status;
        this.message = message;
    }
}