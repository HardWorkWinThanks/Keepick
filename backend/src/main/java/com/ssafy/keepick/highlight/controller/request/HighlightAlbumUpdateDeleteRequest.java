package com.ssafy.keepick.highlight.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumUpdateDeleteRequest {
    private List<Long> deletePhotoIds;
}
