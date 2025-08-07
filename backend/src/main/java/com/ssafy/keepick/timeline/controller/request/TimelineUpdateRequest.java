package com.ssafy.keepick.timeline.controller.request;

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
    @NotNull
    private Long thumbnailId;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;

    @NotNull
    private List<SectionUpdateRequest> sections;

    @NotNull
    private List<Long> photoIds; // 섹션에 사용하지 않는 사진 ID

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

        @NotNull
        private List<Long> photoIds;
    }


}
