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

    @Schema(description = "앨범 이름", example = "여름 휴가")
    @NotBlank(message = "앨범 이름은 필수입니다.")
    private String name;

    @Schema(description = "앨범 설명", example = "2025년 바다 여행 기록")
    private String description;

    @Schema(description = "앨범 대표 사진 ID (썸네일을 수정하지 않는다면 null)", example = "101")
    private Long thumbnailId;

    @Schema(description = "앨범 시작 날짜", example = "2025-07-01")
    private LocalDate startDate;

    @Schema(description = "앨범 종료 날짜", example = "2025-07-10")
    private LocalDate endDate;

    @Schema(description = "앨범의 섹션 목록 (전달된 섹션 순서대로 저장)")
    @NotNull
    private List<SectionUpdateRequest> sections;

    @Getter
    @Builder
    public static class SectionUpdateRequest {

        @Schema(description = "섹션 ID (기존 섹션은 ID 포함, 신규 섹션은 null)", example = "10")
        private Long id;

        @NotBlank(message = "섹션 이름은 필수입니다.")
        @Schema(description = "섹션 이름", example = "해변")
        private String name;

        @Schema(description = "섹션 설명", example = "해변에서의 즐거운 시간")
        private String description;

        @Schema(description = "섹션 시작 날짜", example = "2025-07-01")
        private LocalDate startDate;

        @Schema(description = "섹션 종료 날짜", example = "2025-07-05")
        private LocalDate endDate;

        @Schema(description = "섹션 내 사진 ID 목록 (전달된 사진 순서대로 저장)", example = "[1001, 1002, 1003]")
        @NotNull
        private List<Long> photoIds;
    }

}
