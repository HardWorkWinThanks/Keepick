package com.ssafy.keepick.photo.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.photo.application.ImageService;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.controller.response.GroupPhotoUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
@Tag(name="Image", description = "이미지 관련 API")
public class ImageController {
    private final ImageService imageService;


    @PostMapping("/presigned-url")
    @Operation(summary = "단일 이미지 presigned url 요청", description = "프로필, 증명용 이미지 등, 그룹 사진과 관련없는 이미지를 처리합니다.")
    public ApiResponse<GroupPhotoUploadResponse> generatePresignedUrl(
            @Valid @RequestBody GroupPhotoUploadRequest.ImageFileRequest request) {
        String result = imageService.generatePresignedUrl(request.getFileName(), request.getContentType());
        return  ApiResponse.ok(GroupPhotoUploadResponse.of(result));
    }
}