package com.ssafy.keepick.global.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "에러 응답")
public class ErrorResponse {
    @Schema(description = "HTTP 상태 코드", example = "404")
    private int status;
    
    @Schema(description = "에러 메시지", example = "존재하지 않는 그룹입니다.")
    private String message;
    
    @Schema(description = "에러 코드", example = "G001")
    private String errorCode;
    
    @Schema(description = "에러 발생 시간", example = "2025-08-07T13:46:08.346331600")
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