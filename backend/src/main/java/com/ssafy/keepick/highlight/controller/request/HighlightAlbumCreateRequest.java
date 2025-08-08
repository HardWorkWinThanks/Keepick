package com.ssafy.keepick.highlight.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumCreateRequest {
    private String chatSessionId;
}
