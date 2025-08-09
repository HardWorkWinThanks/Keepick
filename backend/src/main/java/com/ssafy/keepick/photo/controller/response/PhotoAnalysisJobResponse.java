package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.application.dto.PhotoAnalysisDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Slf4j
@Getter
@Builder
@AllArgsConstructor
public class PhotoAnalysisJobResponse {
    private String jodId;
    private JobStatus jobStatus;

    public static PhotoAnalysisJobResponse from(CompletableFuture<PhotoAnalysisDto> photoAnalysisDto) {
        try {
            return PhotoAnalysisJobResponse.builder()
                    .jodId(photoAnalysisDto.get().getJodId())
                    .jobStatus(photoAnalysisDto.get().getJobStatus())
                    .build();
        } catch (InterruptedException | ExecutionException e) {
            log.error("response 변환 중 오류: ", e);
            throw new RuntimeException(e);
        }
    }
}
