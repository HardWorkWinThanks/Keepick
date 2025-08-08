package com.ssafy.keepick.highlight.application.dto;

import com.ssafy.keepick.highlight.domain.HighlightAlbumPhoto;
import com.ssafy.keepick.highlight.domain.HighlightType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumPhotoDto {
    private Long photoId;
    private Long memberId;
    private String chatSessionId;
    private String photoUrl;
    private HighlightType type;
    private LocalDateTime takenAt;

    public static HighlightAlbumPhotoDto from(HighlightAlbumPhoto photo) {
        return HighlightAlbumPhotoDto.builder()
                .photoId(photo.getId())
                .memberId(photo.getMember().getId())
                .chatSessionId(photo.getChatSessionId())
                .photoUrl(photo.getPhotoUrl())
                .takenAt(photo.getTakenAt())
                .type(photo.getType())
                .build();
    }
}
