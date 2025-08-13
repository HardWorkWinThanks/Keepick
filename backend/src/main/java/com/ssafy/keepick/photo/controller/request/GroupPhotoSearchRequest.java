package com.ssafy.keepick.photo.controller.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class GroupPhotoSearchRequest {
    @Schema(description = "검색할 사진에 태그된 그룹 회원 ID 목록", example = "[101, 102, 103]")
    private List<Long> memberIds;
    @Schema(description = "검색할 사진의 태그 목록", example = "[동물, 바다]")
    private List<String> tags;
    @Schema(description = "검색할 사진의 촬영일자 시작일", example = "2020-01-01")
    private LocalDate startDate;
    @Schema(description = "검색할 사진의 촬영일자 종료일", example = "2020-01-03")
    private LocalDate endDate;

    @Schema(description = "페이지 번호", defaultValue = "0")
    private Integer page;
    @Schema(description = "페이지 크기", defaultValue = "10")
    private Integer size;

    public GroupPhotoSearchRequest() {
        this.page = 0;
        this.size = 10;
    }
}
