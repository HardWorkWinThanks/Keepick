package com.ssafy.keepick.photo.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.photo.application.PhotoAnalysisService;
import com.ssafy.keepick.photo.application.PhotoJobProgressService;
import com.ssafy.keepick.photo.application.dto.PhotoAnalysisDto;
import com.ssafy.keepick.photo.controller.request.PhotoAnalysisRequest;
import com.ssafy.keepick.photo.controller.response.PhotoAnalysisJobResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/groups/{groupId}/photos/analysis")
@RequiredArgsConstructor
@Tag(name="Photo Analysis", description = "사진 태깅 및 분류 API")
public class PhotoAnalysisController {
    private final PhotoAnalysisService  photoAnalysisService;
    private final PhotoJobProgressService  photoJobProgressService;

    @PostMapping("/composite")
    @Operation(summary = "YOLO 객체 검출 + 얼굴 매칭 + 흐림 판별 API", description = "비동기 작업으로 처리되며 작업 id만 우선으로 반환합니다.")
    public CompletableFuture<ApiResponse<PhotoAnalysisJobResponse>> invokeBlurDetection(@PathVariable Long groupId,
                                                                                        @RequestBody PhotoAnalysisRequest request) {
        Long currentMemberId = AuthenticationUtil.getCurrentUserId();
        CompletableFuture<PhotoAnalysisDto> result = photoAnalysisService.analysisCompositePhotos(groupId, currentMemberId, request);
        return CompletableFuture.completedFuture(ApiResponse.ok(PhotoAnalysisJobResponse.from(result)));
    }

    @PostMapping("/similarity")
    @Operation(summary = "유사 사진 분류 API", description = "비동기 작업으로 처리되며 작업 id만 우선으로 반환합니다.")
    public CompletableFuture<ApiResponse<PhotoAnalysisJobResponse>> invokeSimilarGrouping(@PathVariable Long groupId) {
        Long currentMemberId = AuthenticationUtil.getCurrentUserId();
        CompletableFuture<PhotoAnalysisDto> result = photoAnalysisService.groupingSimilarPhotos(groupId, currentMemberId);
        return CompletableFuture.completedFuture(ApiResponse.ok(PhotoAnalysisJobResponse.from(result)));
    }

    @GetMapping("/status/{jobId}")
    @Operation(summary = "작업 상태 조회 API", description = """
            비동기적으로 진행되는 이미지 분석 작업의 상태를 조회합니다.
            
            주기적으로 polling 요청을 하며, 작업이 완료되었을 경우 결과 조회 API를 요청합니다.
            
            swagger에서는 테스트가 불가능합니다. POSTMAN등을 이용해주세요.
            """)
    public SseEmitter getJobStatus(@PathVariable("groupId") Long groupId,
                                   @PathVariable("jobId") String jobId) {
        return photoJobProgressService.subscribeToJobStatus(jobId);
    }

//    @GetMapping("/blur/{jobId}")
//    @Operation(summary = "흐린 사진 분류 결과 조회를 위한 API")
//    public ApiResponse<?> getBlurJobResult(@PathVariable String jobId) {
//        return ApiResponse.ok(null);
//    }
//
//    @GetMapping("/similarity/{jobId}")
//    @Operation(summary = "유사 사진 분류 결과 조회를 위한 API")
//    public ApiResponse<?> getSimilarityJobResult(@PathVariable String jobId) {
//        return ApiResponse.ok(null);
//    }
//
//    @GetMapping("/face/{jobId}")
//    @Operation(summary = "사용자 얼굴 식별 결과 조회를 위한 API")
//    public ApiResponse<?> getFaceJobResult(@PathVariable String jobId) {
//        return ApiResponse.ok(null);
//    }

}