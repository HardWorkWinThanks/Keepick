package com.ssafy.keepick.friend.controller.response;

import com.ssafy.keepick.friend.application.dto.FriendStatus;
import com.ssafy.keepick.friend.application.dto.FriendshipDto;
import com.ssafy.keepick.friend.domain.FriendshipStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
@Getter
public class FriendDetailResponse {
    @Schema(description = "친구 요청 ID", example = "1001")
    private Long friendshipId;

    @Schema(description = "친구 ID", example = "202")
    private Long friendId;

    @Schema(description = "친구 이름", example = "홍길동")
    private String name;

    @Schema(description = "친구 닉네임", example = "gildong123")
    private String nickname;

    @Schema(description = "친구 프로필 이미지 URL (프로필 이미지가 없는 회원의 경우 null 입니다)", example = "https://example.com/profile.jpg", nullable = true)
    private String profileUrl;

    @Schema(description = "친구 요청에 대한 응답 상태", example = "PENDING(친구 요청 중), ACCEPTED(친구 요청 수락함), REJECTED(친구 요청 거절함")
    private FriendshipStatus friendshipStatus;

    @Schema(description = "친구 요청 상태 (요청 시와 같은 친구 상태 조건 / 내가 보낸 요청인지 받은 요청인지 구분하는 값)", example = "FRIEND(친구), SENT(친구 요청 보냄), RECEIVED(친구 요청 받음)")
    private FriendStatus friendStatus;

    @Schema(description = "최초 친구 요청 일시", example = "2025-08-09T14:30:00")
    private LocalDateTime requestedAt;

    @Schema(description = "친구 응답 일시", example = "2025-08-10T16:00:00")
    private LocalDateTime respondedAt;

    public static FriendDetailResponse toResponse(FriendshipDto dto) {
        return FriendDetailResponse
                .builder()
                .friendshipId(dto.getFriendshipId())
                .friendId(dto.getFriendId())
                .name(dto.getName())
                .nickname(dto.getNickname())
                .profileUrl(dto.getProfileUrl())
                .friendshipStatus(dto.getFriendshipStatus())
                .friendStatus(dto.getFriendStatus())
                .requestedAt(dto.getCreatedAt())
                .respondedAt(dto.getUpdatedAt())
                .build();
    }
}
