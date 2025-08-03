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

@Slf4j
@RestController
@RequestMapping("/api/image")
@RequiredArgsConstructor
public class ImageController {
    private final ImageService imageService;

    /**
     * Presigned URL 배열 생성 API
     */
    @PostMapping("/presigned-urls")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> generatePresignedUrls(
            @Valid @RequestBody ImageUploadRequest request) {
        PresignedUrlResponse response = imageService.generatePresignedUrls(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}