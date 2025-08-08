package com.ssafy.keepick.highlight.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumUpdateRequest {
    private String name;
    private String description;
    private Long thumbnailId;
}
