package com.ssafy.keepick.friend.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendCreateRequest {
    @Schema(description = "친구 요청을 보낼 회원의 ID", example = "101")
    @NotNull(message = "친구 요청을 보낼 회원을 선택해주세요.")
    private Long friendId;
}
