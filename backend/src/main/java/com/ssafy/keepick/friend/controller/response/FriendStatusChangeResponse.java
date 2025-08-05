package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.FriendStatus;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendStatusChangeResponse {
    private Long friendshipId;
    private Long friendId;
    private FriendshipStatus friendshipStatus;
    private FriendStatus friendStatus;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    public static FriendStatusChangeResponse toResponse(FriendshipDto dto) {
        return FriendStatusChangeResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .friendshipStatus(dto.getFriendshipStatus())
                .friendStatus(dto.getFriendStatus())
                .requestedAt(dto.getCreatedAt())
                .respondedAt(dto.getUpdatedAt())
                .build();
    }
}
