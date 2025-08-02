package com.ssafy.keepick.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.of(ResponseCode.OK, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.of(ResponseCode.CREATED, data);
    }

    public static <T> ApiResponse<T> of(ResponseCode code, T data) {
        return new ApiResponse<>(code.getStatus(), code.getMessage(), data);
    }

    public static <T> ApiResponse<T> of(ResponseCode code) {
        return new ApiResponse<>(code.getStatus(), code.getMessage(), null);
    }

}