package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.FriendStatus;
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
    private String name;
    private String nickname;
    private FriendStatus friendStatus;
    private LocalDateTime requestedAt;

    public static FriendCreateResponse toResponse(FriendshipDto dto) {
        return FriendCreateResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .name(dto.getName())
                .nickname(dto.getNickname())
                .friendStatus(dto.getFriendStatus())
                .requestedAt(dto.getCreatedAt())
                .build();
    }

}
