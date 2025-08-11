package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.GroupDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupCreateResponse {

    @Schema(description = "생성된 그룹 ID", example = "101")
    private Long groupId;

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    private String name;

    @Schema(description = "그룹 설명", example = "대학교에서 만난 친구들과의 사진 모음")
    private String description;

    @Schema(description = "그룹 대표 사진 URL", example = "http://example.com")
    private String groupThumbnailUrl;

    @Schema(description = "그룹 생성일시", example = "2025-08-09T12:00:00")
    private LocalDateTime createdAt;

    public static GroupCreateResponse toResponse(GroupDto dto) {
        return GroupCreateResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getName())
                .description(dto.getDescription())
                .groupThumbnailUrl(dto.getThumbnailUrl())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
