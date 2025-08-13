package com.ssafy.keepick.group.controller.response;

import com.ssafy.keepick.group.application.dto.GroupDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupDetailResponse {

    @Schema(description = "그룹 ID", example = "101")
    private Long groupId;

    @Schema(description = "그룹 이름", example = "대학교 친구들")
    private String name;

    @Schema(description = "그룹 설명", example = "대학교에서 만난 친구들과의 그룹.", nullable = true)
    private String description;

    @Schema(description = "그룹 대표 사진 URL (대표 사진을 업로드하지 않은 경우 null 입니다)", example = "http://example.com", nullable = true)
    private String thumbnailUrl;

    @Schema(description = "그룹 회원 수", example = "10")
    private Integer memberCount;

    @Schema(description = "그룹 생성 회원 ID", example = "202")
    private Long creatorId;

    @Schema(description = "그룹 생성 회원 이름", example = "홍길동")
    private String creatorName;

    @Schema(description = "그룹 생성일시", example = "2025-08-09T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "그룹 수정일시", example = "2025-08-10T15:30:00")
    private LocalDateTime updatedAt;

    public static GroupDetailResponse toResponse(GroupDto dto) {
        return GroupDetailResponse
                .builder()
                .groupId(dto.getGroupId())
                .name(dto.getName())
                .description(dto.getDescription())
                .thumbnailUrl(dto.getThumbnailUrl())
                .memberCount(dto.getMemberCount())
                .creatorId(dto.getCreatorId())
                .creatorName(dto.getCreatorName())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
