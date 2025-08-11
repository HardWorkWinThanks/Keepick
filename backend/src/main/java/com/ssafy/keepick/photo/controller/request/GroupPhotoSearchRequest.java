package com.ssafy.keepick.photo.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoSearchRequest {
    private List<Long> memberIds;
    private List<String> tags;
    private LocalDate startDate;
    private LocalDate endDate;
    private int page;
    private int size;

    public GroupPhotoSearchRequest() {
        this.page = 0;
        this.size = 10;
    }
}
