package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import jakarta.annotation.security.DenyAll;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
@DenyAll
public class HighlightScreenshotSaveResponse {
    private Long photoId;
    private Long memberId;
    private String chatSessionId;
    private String photoUrl;
    private String type;
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
