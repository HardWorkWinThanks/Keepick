package com.ssafy.keepick.timeline.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class TimelineUpdateRequest {

    @NotBlank
    private String name;
    @NotBlank
    private String description;

    @Schema(description = "앨범 대표 사진 ID (선택 사항, 대표 사진을 수정할 경우 사진의 ID)", example = "101")
    private Long thumbnailId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @Schema(description = "앨범의 섹션 목록 (전달된 섹션 순서대로 저장)")
    @NotNull
    private List<SectionUpdateRequest> sections;

    @Schema(description = "섹션에 사용하지 않는 사진 ID 목록")
    @NotNull
    private List<Long> unusedPhotoIds;
    
    @Getter
    @Builder
    public static class SectionUpdateRequest {
        private Long id; // 기존 섹션이면 ID 포함, 새로 추가할 경우 null

        @NotBlank
        private String name;

        @NotBlank
        private String description;

        @NotNull
        private LocalDate startDate;

        @NotNull
        private LocalDate endDate;

        @Schema(description = "섹션 내 사진 목록 (전달된 사진 순서대로 저장)")
        @NotNull
        private List<Long> photoIds;
    }

}
