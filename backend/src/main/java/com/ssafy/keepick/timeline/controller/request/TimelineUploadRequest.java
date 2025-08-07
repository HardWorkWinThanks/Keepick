package com.ssafy.keepick.timeline.controller.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TimelineUploadRequest {

    @NotNull
    private List<Long> photoIds;

}
