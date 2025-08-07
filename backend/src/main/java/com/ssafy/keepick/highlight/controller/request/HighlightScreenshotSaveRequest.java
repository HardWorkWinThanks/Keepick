package com.ssafy.keepick.highlight.controller.request;

import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
import com.ssafy.keepick.highlight.domain.HighlightType;
import com.ssafy.keepick.member.domain.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class HighlightScreenshotSaveRequest {
    private String chatSessionId;
    private HighlightType type;
    private String imageUrl;
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
