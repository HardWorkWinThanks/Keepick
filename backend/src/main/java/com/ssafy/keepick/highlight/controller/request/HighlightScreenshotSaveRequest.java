package com.ssafy.keepick.highlight.controller.request;

import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
import com.ssafy.keepick.highlight.domain.HighlightType;
import com.ssafy.keepick.member.domain.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class HighlightScreenshotSaveRequest {
    @NotNull(message = "Chat Session Id는 필수입니다.")
    private String chatSessionId;

    @Schema(description = "하이라이트 타입 (예: LAUGH, SURPRISE, SERIOUS)", example = "LAUGH")
    @NotNull(message = "하이라이트 타입은 필수입니다.")
    private HighlightType type;

    @NotNull(message = "하이라이트 스크린샷 URL은 필수입니다.")
    private String imageUrl;

    @Schema(description = "하이라이트 촬영 시각", example = "2025-08-11T14:15:32")
    @NotNull(message = "하이라이트 촬영시각은 필수입니다.")
    private LocalDateTime takenAt;

    public HighlightAlbumPhoto toEntity(Member member) {
        return HighlightAlbumPhoto.builder()
                .member(member)
                .takenAt(takenAt)
                .photoUrl(imageUrl)
                .type(type)
                .chatSessionId(chatSessionId)
                .build();
    }
}
