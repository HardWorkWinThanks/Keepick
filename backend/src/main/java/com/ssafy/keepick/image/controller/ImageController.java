package com.ssafy.keepick.image.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.image.application.ImageService;
import com.ssafy.keepick.image.controller.dto.ImageUploadRequest;
import com.ssafy.keepick.image.controller.dto.PresignedUrlResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class ImageController {
    private final ImageService imageService;

    /**
     * Presigned URL 배열 생성 API
     */
    @PostMapping("/presigned-urls")
    public ResponseEntity<ApiResponse<List<PresignedUrlResponse>>> generatePresignedUrls(
            @Valid @RequestBody ImageUploadRequest request) {
        List<String> result = imageService.generatePresignedUrls(request);
        List<PresignedUrlResponse> response = result.stream()
                .map(PresignedUrlResponse::of)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Presigned URL 생성 API
     */
    @PostMapping("/presigned-url")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> generatePresignedUrl(
            @Valid @RequestBody ImageUploadRequest.ImageFileRequest request) {
        String result = imageService.generatePresignedUrl(request.getFileName(), request.getContentType());
        return  ResponseEntity.ok(ApiResponse.ok(PresignedUrlResponse.of(result)));
    }
}