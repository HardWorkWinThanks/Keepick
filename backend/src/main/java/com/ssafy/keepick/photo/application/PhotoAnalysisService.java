package com.ssafy.keepick.photo.application;

import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.external.visionai.VisionAIService;
import com.ssafy.keepick.external.visionai.request.BlurDetectionRequest;
import com.ssafy.keepick.external.visionai.request.SimilarGroupingRequest;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.application.dto.PhotoAnalysisDto;
import com.ssafy.keepick.photo.domain.Photo;
import com.ssafy.keepick.photo.domain.PhotoAnalysisJob;
import com.ssafy.keepick.photo.persistence.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoAnalysisService {
    private final PhotoRepository photoRepository;
    private final GroupMemberRepository groupRepository;
    private final VisionAIService  visionAIService;
    private final RedisService redisService;

    @Async
    public CompletableFuture<PhotoAnalysisDto> detectBlurPhotos(Long groupId) {
        // 1. 사용자가 그룹에 속한 사용자가 맞는지 확인
        Long currentMemberId = AuthenticationUtil.getCurrentUserId();
        groupRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));

        // 2. 그룹 갤러리의 삭제되지 않은 모든 사진 조회
        List<Photo> photos = photoRepository.findByGroupIdAndDeletedAtIsNull(groupId);

        // 3. 분석 요청 request 변환
        BlurDetectionRequest request = BlurDetectionRequest.from(photos);

        // 4. 작업 상태 저장
        String jobId = UUID.randomUUID().toString();
        PhotoAnalysisJob job = PhotoAnalysisJob.builder()
                .jobId(jobId)
                .groupId(groupId)
                .jobStatus(JobStatus.PENDING)
                .jobType("blur_detection")
                .startTime(LocalDateTime.now())
                .totalImages(photos.size())
                .processedImages(0)
                .memberId(currentMemberId)
                .build();
        redisService.setValue(jobId, job.toString(), Duration.ofHours(1));

        // 5. vision ai 에 분석 요청
        visionAIService.postBlurRequest(jobId, request)
                .subscribe(
                        response -> log.info("작업 완료 {}", response),
                        error -> log.error("작업 실패", error)
                );

        return CompletableFuture.completedFuture(PhotoAnalysisDto.of(jobId, JobStatus.PENDING));
    }

    @Async
    public CompletableFuture<PhotoAnalysisDto> groupingSimilarPhotos(Long groupId) {
        // 1. 사용자가 그룹에 속한 사용자가 맞는지 확인
        Long currentMemberId = AuthenticationUtil.getCurrentUserId();
        groupRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));

        // 2. 그룹 갤러리의 삭제되지 않은 모든 사진 조회
        List<Photo> photos = photoRepository.findByGroupIdAndDeletedAtIsNull(groupId);

        // 3. 분석 요청 request 변환
        SimilarGroupingRequest request = SimilarGroupingRequest.from(photos);

        // 4. 작업 상태 저장
        String jobId = UUID.randomUUID().toString();
        PhotoAnalysisJob job = PhotoAnalysisJob.builder()
                .jobId(jobId)
                .groupId(groupId)
                .jobStatus(JobStatus.PENDING)
                .jobType("similar_grouping")
                .startTime(LocalDateTime.now())
                .totalImages(photos.size())
                .processedImages(0)
                .memberId(currentMemberId)
                .build();
        redisService.setValue(jobId, job.toString(), Duration.ofHours(1));

        // 5. vision ai 에 분석 요청
        visionAIService.postSimilarityRequest(jobId, request)
                .subscribe(
                        response -> log.info("작업 완료 {}", response),
                        error -> log.error("작업 실패", error)
                );

        return CompletableFuture.completedFuture(PhotoAnalysisDto.of(jobId, JobStatus.PENDING));
    }

}
