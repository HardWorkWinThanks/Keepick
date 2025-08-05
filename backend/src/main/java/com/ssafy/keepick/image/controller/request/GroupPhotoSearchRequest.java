package com.ssafy.keepick.image.controller.request;

import com.ssafy.keepick.image.domain.Tag;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class GroupPhotoSearchRequest {
    private List<Long> memberIds;
    private List<Tag> tags;
    private LocalDate startDate;
    private LocalDate endDate;
    private int page = 0;
    private int size = 10;
}
