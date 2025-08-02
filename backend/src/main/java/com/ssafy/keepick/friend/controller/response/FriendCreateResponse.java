package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendCreateResponse {

    private Long friendshipId;
    private Long friendId;
    private FriendshipStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    public static FriendCreateResponse toResponse(FriendshipDto dto) {
        return FriendCreateResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getReceiverId())
                .status(dto.getStatus())
                .requestedAt(dto.getCreatedAt())
                .respondedAt(dto.getUpdatedAt())
                .build();
    }

}
