package com.ssafy.keepick.photo.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.keepick.external.redis.RedisService;
import com.ssafy.keepick.external.visionai.VisionAIService;
import com.ssafy.keepick.external.visionai.request.CompositeAnalysisRequest;
import com.ssafy.keepick.external.visionai.request.SimilarGroupingRequest;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;
import com.ssafy.keepick.group.domain.GroupMember;
import com.ssafy.keepick.group.persistence.GroupMemberRepository;
import com.ssafy.keepick.member.domain.Member;
import com.ssafy.keepick.photo.application.dto.JobStatus;
import com.ssafy.keepick.photo.application.dto.PhotoAnalysisDto;
import com.ssafy.keepick.photo.controller.request.PhotoAnalysisRequest;
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
    private final PhotoAnalysisResultService photoAnalysisResultService;
    private final ObjectMapper objectMapper;


    @Async("asyncExecutor")
    public CompletableFuture<PhotoAnalysisDto> groupingSimilarPhotos(Long groupId, Long currentMemberId) {
        // 1. 사용자가 그룹에 속한 사용자가 맞는지 확인
        groupRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));

        // 2. 그룹 갤러리의 삭제되지 않은 모든 사진 조회
        List<Photo> photos = photoRepository.findByGroupIdAndDeletedAtIsNull(groupId);

        // 3. 분석 요청 request 변환
        String jobId = UUID.randomUUID().toString();
        SimilarGroupingRequest request = SimilarGroupingRequest.from(jobId, photos);

        // 4. 작업 상태 저장
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
        try {
            String jobJson = objectMapper.writeValueAsString(job);
            redisService.setValue(jobId, jobJson, Duration.ofHours(1));
        } catch (JsonProcessingException e) {
            throw new BaseException(ErrorCode.INTERNAL_VISION_PARSE_ERROR);
        }

        // 5. vision ai 에 분석 요청
        visionAIService.postSimilarityRequest(request)
                .subscribe(
                        response -> {
                            log.info("작업 완료 {}", response);
                            photoAnalysisResultService.saveGroupingResult(response);
                        },
                        error -> log.error("작업 실패", error)
                );

        return CompletableFuture.completedFuture(PhotoAnalysisDto.of(jobId, JobStatus.PENDING));
    }

    @Async("asyncExecutor")
    public CompletableFuture<PhotoAnalysisDto> analysisCompositePhotos(Long groupId, Long currentMemberId, PhotoAnalysisRequest request) {
        // 1. 사용자가 그룹에 속한 사용자가 맞는지 확인
        groupRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                .orElseThrow(() -> new BaseException(ErrorCode.NOT_FOUND));
        // 2-1. request의 모든 사진 조회
        // 2-2. 그룹의 모든 사용자 조회
        List<Photo> photos = photoRepository.findAllById(request.getPhotoIds());

        List<Member> members = groupRepository.findJoinedMembersById(groupId).stream()
                .map(GroupMember::getMember)
                .toList();

        // 3. 분석 요청 request 변환
        String jobId = UUID.randomUUID().toString();
        CompositeAnalysisRequest compositeAnalysisRequest = CompositeAnalysisRequest.from(jobId, members, photos);

        // 4. 작업 상태 저장
        PhotoAnalysisJob job = PhotoAnalysisJob.builder()
                .jobId(jobId)
                .groupId(groupId)
                .jobStatus(JobStatus.PENDING)
                .jobType("composite")
                .startTime(LocalDateTime.now())
                .totalImages(photos.size())
                .processedImages(0)
                .memberId(currentMemberId)
                .build();
        try {
            String jobJson = objectMapper.writeValueAsString(job);
            redisService.setValue(jobId, jobJson, Duration.ofHours(1));
        } catch (JsonProcessingException e) {
            throw new BaseException(ErrorCode.INTERNAL_VISION_PARSE_ERROR);
        }

        // 5. vision ai 에 분석 요청
        visionAIService.postFaceTaggingRequest(compositeAnalysisRequest)
                .subscribe(
                        response -> {
                            log.info("작업 완료 {}", response.toString());
                            photoAnalysisResultService.saveAnalysisResult(response);
                        },
                        error -> log.error("작업 실패", error)
                );

        return CompletableFuture.completedFuture(PhotoAnalysisDto.of(jobId, JobStatus.PENDING));
    }
}
