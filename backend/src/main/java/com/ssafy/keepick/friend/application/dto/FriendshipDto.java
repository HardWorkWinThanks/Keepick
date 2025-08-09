package com.ssafy.keepick.friend.application.dto;

import com.ssafy.keepick.friend.domain.Friendship;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import com.ssafy.keepick.member.domain.Member;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendshipDto {
    private Long friendshipId;
    private Long friendId;
    private String name;
    private String nickname;
    private String profileUrl;
    private String email;
    private FriendshipStatus friendshipStatus;
    private FriendStatus friendStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FriendshipDto from(Friendship friendship, Member friend, FriendStatus status) {
        return FriendshipDto
                .builder()
                .friendshipId(friendship.getId())
                .friendId(friend.getId())
                .name(friend.getName())
                .nickname(friend.getNickname())
                .profileUrl(friend.getProfileUrl())
                .email(friend.getEmail())
                .friendshipStatus(friendship.getStatus())
                .friendStatus(status)
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}
