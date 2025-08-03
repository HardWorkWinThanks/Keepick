package com.ssafy.keepick.friend.application.dto;

import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import com.ssafy.keepick.member.domain.Member;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendDto {
    private Long friendshipId;
    private Long friendId;
    private String name;
    private String nickname;
    private String profileUrl;
    private FriendshipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FriendDto from(Friendship friendship, Member friend) {
        return FriendDto
                .builder()
                .friendshipId(friendship.getId())
                .friendId(friend.getId())
                .name(friend.getName())
                .nickname(friend.getNickname())
                .profileUrl(friend.getProfileUrl())
                .status(friendship.getStatus())
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}
