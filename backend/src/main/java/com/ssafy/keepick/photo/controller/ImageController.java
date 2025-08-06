package com.ssafy.keepick.photo.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.photo.application.ImageService;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.controller.response.GroupPhotoUploadResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class ImageController {
    private final ImageService imageService;


    @PostMapping("/presigned-url")
    public ApiResponse<GroupPhotoUploadResponse> generatePresignedUrl(
            @Valid @RequestBody GroupPhotoUploadRequest.ImageFileRequest request) {
        String result = imageService.generatePresignedUrl(request.getFileName(), request.getContentType());
        return  ApiResponse.ok(GroupPhotoUploadResponse.of(result));
    }
}