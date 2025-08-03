package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.dto.FriendDto;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
@Getter
public class FriendDetailResponse {
    private Long friendshipId;
    private Long friendId;
    private String name;
    private String nickname;
    private String profileUrl;
    private FriendshipStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    public static FriendDetailResponse toResponse(FriendDto dto) {
        return FriendDetailResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .name(dto.getName())
                .nickname(dto.getNickname())
                .profileUrl(dto.getProfileUrl())
                .status(dto.getStatus())
                .requestedAt(dto.getCreatedAt())
                .respondedAt(dto.getUpdatedAt())
                .build();
    }
}
