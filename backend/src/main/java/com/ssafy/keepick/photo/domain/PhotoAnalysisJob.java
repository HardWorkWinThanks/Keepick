package com.ssafy.keepick.photo.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.keepick.photo.application.dto.JobStatus;
import lombok.*;

import java.time.LocalDateTime;

@ToString
@Getter
@Setter
@Builder
@AllArgsConstructor
// request data 포함할지 고민
public class PhotoAnalysisJob {
    @JsonProperty("job_id")
    private String jobId;
    @JsonProperty("job_type")
    private String jobType;
    @JsonProperty("message")
    private String message;
    @JsonProperty("job_status")
    private JobStatus jobStatus;
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
//    @JsonProperty("result")
//    private String result;
    @JsonProperty("total_images")
    private Integer totalImages;
    @JsonProperty("processed_images")
    private Integer processedImages;
}
