package com.ssafy.keepick.image.controller.request;

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
    private int page = 0;
    private int size = 10;
}
