package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.application.dto.PhotoAnalysisDto;
import io.swagger.v3.oas.annotations.media.Schema;
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
    @Schema(description = "진행상황 확인에 사용할 job id. not null")
    private String jobId;
    @Schema(description = "작업의 현황. 요청 즉시 반환하여 항상 STARTED. not null")
    private JobStatus jobStatus;

    public static PhotoAnalysisJobResponse from(CompletableFuture<PhotoAnalysisDto> future) {
        try {
            var dto = future.get();
            return PhotoAnalysisJobResponse.builder()
                    .jobId(dto.getJodId())
                    .jobStatus(dto.getJobStatus())
                    .build();
        } catch (InterruptedException | ExecutionException e) {
            log.error(e.getMessage());
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
