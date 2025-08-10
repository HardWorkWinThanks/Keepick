package com.ssafy.keepick.group.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupCreateRequest {

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    @NotBlank(message = "그룹 이름은 필수입니다.")
    private String name;
}
