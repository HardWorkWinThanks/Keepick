package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendCreateResponse {

    @Schema(description = "친구 요청 ID", example = "1001")
    private Long friendshipId;

    @Schema(description = "친구 ID", example = "202")
    private Long friendId;

    @Schema(description = "친구 요청 일시", example = "2025-08-09T14:30:00")
    private LocalDateTime requestedAt;

    public static FriendCreateResponse toResponse(FriendshipDto dto) {
        return FriendCreateResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .requestedAt(dto.getCreatedAt())
                .build();
    }

}
