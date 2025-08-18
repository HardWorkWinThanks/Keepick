package com.ssafy.keepick.photo.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PhotoAnalysisDto {
    private String jodId;
    private JobStatus jobStatus;

    public static PhotoAnalysisDto of(String jodId, JobStatus jobStatus) {
        return PhotoAnalysisDto.builder()
                .jodId(jodId)
                .jobStatus(jobStatus)
                .build();
    }
}
