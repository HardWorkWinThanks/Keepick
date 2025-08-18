package com.ssafy.keepick.highlight.controller.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumUpdateDeleteRequest {
    @NotEmpty(message = "삭제할 사진 목록은 필수입니다.")
    private List<Long> deletePhotoIds;
}
