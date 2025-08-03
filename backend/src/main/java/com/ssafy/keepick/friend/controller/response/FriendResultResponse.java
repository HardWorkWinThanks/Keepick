package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendResultResponse {
    private Long friendshipId;
    private Long friendId;
    private String name;
    private String nickname;
    private FriendshipStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    public static FriendResultResponse toResponse(FriendshipDto dto) {
        return FriendResultResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .name(dto.getName())
                .nickname(dto.getNickname())
                .status(dto.getStatus())
                .requestedAt(dto.getCreatedAt())
                .respondedAt(dto.getUpdatedAt())
                .build();
    }
}
