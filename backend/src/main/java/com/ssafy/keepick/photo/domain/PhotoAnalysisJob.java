package com.ssafy.keepick.photo.domain;

import com.ssafy.keepick.photo.application.dto.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
// request data 포함할지 고민
public class PhotoAnalysisJob {
    private String jobId;
    private Long groupId;
    private Long memberId;
    private String jobType;
    private JobStatus jobStatus;
    private LocalDateTime startTime;
    private LocalDateTime completedTime;
    private String result;
    private Integer totalImages;
    private Integer processedImages;
}
