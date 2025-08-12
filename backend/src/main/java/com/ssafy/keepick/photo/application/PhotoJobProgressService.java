package com.ssafy.keepick.photo.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.controller.response.PhotoAnalysisJobStatusResponse;
import com.ssafy.keepick.photo.domain.PhotoAnalysisJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoJobProgressService {
    private final RedisService redisService;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor = Executors.newCachedThreadPool();


    public SseEmitter subscribeToJobStatus(String jobId) {
        SseEmitter emitter = new SseEmitter(30_000L); // 30초 타임아웃

        executor.execute(() -> {
            try {
                while (true) {
                    String json = redisService.getValue(jobId);
                    if (json == null) {
                        // 키 없음, 에러 전송 후 종료
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data("Job not found: " + jobId));
                        emitter.complete();
                        break;
                    }

                    PhotoAnalysisJob job = objectMapper.readValue(json, PhotoAnalysisJob.class);

                    // 클라이언트에 상태 전송
                    emitter.send(SseEmitter.event()
                            .name("job-status")
                            .data(PhotoAnalysisJobStatusResponse.from(job)));

                    // 상태 확인 (json 파싱하여 status 체크)
                    JobStatus status = job.getJobStatus();
                    if (status == JobStatus.COMPLETED || status == JobStatus.FAILED) {
                        emitter.complete();
                        break;
                    }

                    // 1초 대기
                    TimeUnit.SECONDS.sleep(1);
                }
            } catch (IOException | InterruptedException e) {
                emitter.completeWithError(e);
            }
        });

        emitter.onCompletion(() -> log.info("SSE 연결 종료: {}", jobId));
        emitter.onTimeout(emitter::complete);

        return emitter;
    }
}
