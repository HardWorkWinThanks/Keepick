package com.ssafy.keepick.friend.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendCreateRequest {
    @Schema(description = "친구 요청을 보낼 회원들의 ID 목록", example = "[101, 102, 103]")
    @NotNull(message = "최소 1명의 회원에게 친구 요청을 보내야 합니다.")
    private Long friendId;
}
