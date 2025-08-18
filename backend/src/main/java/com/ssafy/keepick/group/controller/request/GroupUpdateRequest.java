package com.ssafy.keepick.group.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupUpdateRequest {

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    @NotBlank(message = "그룹 이름은 필수입니다.")
    private String name;

    @Schema(description = "그룹 설명", example = "같이 공부하는 친구들 그룹입니다.")
    @NotBlank(message = "그룹 설명은 필수입니다.")
    private String description;

    @Schema(description = "그룹 썸네일 이미지 URL", example = "https://example.com/thumbnail.png")
    @NotBlank(message = "썸네일 URL은 필수입니다.")
    private String thumbnailUrl;
}
