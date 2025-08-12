package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.security.DenyAll;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
@DenyAll
public class HighlightScreenshotSaveResponse {

    @Schema(description = "하이라이트 ID", example = "101")
    private Long photoId;

    @Schema(description = "하이라이트에 찍힌 회원 ID", example = "101")
    private Long memberId;

    @Schema(description = "하이라이트 그룹챗 세션 ID")
    private String chatSessionId;

    @Schema(description = "하이라이트 스크린샷 URL", example = "http://highlight.com")
    private String photoUrl;

    @Schema(description = "하이라이트 타입 (예: LAUGH, SURPRISE, SERIOUS)", example = "101")
    private String type;

    @Schema(description = "하이라이트 촬영 시각", example = "2025-08-01")
    private String takenAt;

    public static HighlightScreenshotSaveResponse from(HighlightAlbumPhotoDto photo) {
        return HighlightScreenshotSaveResponse.builder()
                .photoId(photo.getPhotoId())
                .memberId(photo.getMemberId())
                .chatSessionId(photo.getChatSessionId())
                .photoUrl(photo.getPhotoUrl())
                .takenAt(photo.getTakenAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .type(photo.getType().name())
                .build();
    }
}
