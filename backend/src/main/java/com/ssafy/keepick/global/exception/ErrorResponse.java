package com.ssafy.keepick.global.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ErrorResponse {
    private int status;
    private String message;
    private String errorCode;
    private String timeStamp;

    public static ErrorResponse of(ErrorCode errorCode) {
        return ErrorResponse.builder()
                .status(errorCode.getStatus().value())
                .message(errorCode.getMessage())
                .errorCode(errorCode.getCode())
                .timeStamp(LocalDateTime.now().toString())
                .build();
    }
}