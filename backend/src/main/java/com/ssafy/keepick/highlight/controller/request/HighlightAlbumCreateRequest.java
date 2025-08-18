package com.ssafy.keepick.highlight.controller.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumCreateRequest {
    @NotNull(message = "Chat Session Id는 필수입니다.")
    private String chatSessionId;
}
