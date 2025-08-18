package com.ssafy.keepick.photo.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoDeleteRequest {
    @Schema(description = "삭제한 사진 ID 목록", example = "[101, 102, 103]")
    List<Long> photoIds;
}
