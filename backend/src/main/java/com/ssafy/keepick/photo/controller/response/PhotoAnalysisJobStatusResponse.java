package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.domain.PhotoAnalysisJob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PhotoAnalysisJobStatusResponse {
    private String jobId;
    private JobStatus jobStatus;
    private Integer completedJob;
    private Integer totalJob;
    private Integer failedJob;
    private Integer pendingJob;

    public static PhotoAnalysisJobStatusResponse from(PhotoAnalysisJob job) {
        return PhotoAnalysisJobStatusResponse.builder()
                .jobId(job.getJobId())
                .jobStatus(job.getJobStatus())
                .completedJob(job.getProcessedImages())
                .totalJob(job.getTotalImages())
                .failedJob(job.getJobStatus() == JobStatus.FAILED ? job.getTotalImages() : 0)
                .pendingJob(job.getTotalImages() - job.getProcessedImages())
                .build();

    }
}
