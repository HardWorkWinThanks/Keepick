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
    private List<Long> memberIds;
    private List<String> tags;
    private LocalDate startDate;
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
