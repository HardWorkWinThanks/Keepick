package com.ssafy.keepick.friend.application.dto;

import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendshipDto {
    private Long friendshipId;
    private Long senderId;
    private String senderName;
    private String senderNickname;
    private Long receiverId;
    private String receiverName;
    private String receiverNickname;
    private FriendshipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FriendshipDto from(Friendship friendship) {
        return FriendshipDto.builder()
                .friendshipId(friendship.getId())
                .senderId(friendship.getSender().getId())
                .senderName(friendship.getSender().getName())
                .senderNickname(friendship.getSender().getNickname())
                .receiverId(friendship.getReceiver().getId())
                .receiverName(friendship.getReceiver().getName())
                .receiverNickname(friendship.getReceiver().getNickname())
                .status(friendship.getStatus())
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}
