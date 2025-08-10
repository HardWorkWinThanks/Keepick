package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
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

    public static PhotoAnalysisJobResponse from(CompletableFuture<PhotoAnalysisDto> future) {
        try {
            var dto = future.get();
            return PhotoAnalysisJobResponse.builder()
                    .jodId(dto.getJodId())
                    .jobStatus(dto.getJobStatus())
                    .build();
        } catch (InterruptedException | ExecutionException e) {
            log.error(e.getMessage());
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
