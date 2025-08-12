package com.ssafy.keepick.highlight.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumUpdateRequest {
    @NotBlank(message = "앨범 이름은 필수입니다.")
    private String name;
    private String description;
    private Long thumbnailId;
}
