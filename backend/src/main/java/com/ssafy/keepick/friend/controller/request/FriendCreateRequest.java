package com.ssafy.keepick.friend.controller.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendCreateRequest {
    @NotNull
    private Long friendId;
}
