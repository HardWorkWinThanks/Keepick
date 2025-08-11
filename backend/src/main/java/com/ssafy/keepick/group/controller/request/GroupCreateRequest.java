package com.ssafy.keepick.group.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;
import org.springframework.boot.context.properties.bind.DefaultValue;

@Getter
@Builder
public class GroupCreateRequest {

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    @NotBlank(message = "그룹 이름은 필수입니다.")
    private String name;

    @Schema(description = "그룹 설명", example = "대학교에서 만난 친구들과의 사진 모음")
    private String description;

    @Schema(description = "그룹 대표 사진 URL", example = "http://example.com")
    private String groupThumbnailUrl;
    
}
