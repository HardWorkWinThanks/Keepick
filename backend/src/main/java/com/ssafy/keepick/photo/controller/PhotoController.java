package com.ssafy.keepick.photo.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.photo.application.GroupPhotoService;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.controller.response.GroupPhotoDetailResponse;
import com.ssafy.keepick.photo.controller.response.GroupPhotoIdResponse;
import com.ssafy.keepick.photo.controller.response.PhotoUploadResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhotoController {
    private final GroupPhotoService groupPhotoService;

    @GetMapping("/photos/random")
    public ApiResponse<List<GroupPhotoDetailResponse>> getRandomPhotos(@RequestParam(defaultValue = "10") int size) {
        Long memberId = AuthenticationUtil.getCurrentUserId();
        List<GroupPhotoDto> result = groupPhotoService.getRandomPhotos(memberId, size);
        return ApiResponse.ok(GroupPhotoDetailResponse.from(result));
    }


    @PostMapping("/groups/{groupId}/photos/presigned-urls")
    public ApiResponse<List<PhotoUploadResponse>> generatePresignedUrls(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupPhotoUploadRequest request) {
        List<String> result = groupPhotoService.uploadGroupPhoto(groupId, request);
        List<PhotoUploadResponse> response = result.stream()
                .map(PhotoUploadResponse::of)
                .collect(Collectors.toList());
        return ApiResponse.ok(response);
    }


    @GetMapping("/groups/{groupId}/photos")
    public ApiResponse<PagingResponse<GroupPhotoDetailResponse>>  getGroupPhotos(
            @PathVariable Long groupId,
            @ModelAttribute GroupPhotoSearchRequest request) {
        Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(groupId, request);
        return ApiResponse.ok(PagingResponse.from(result, GroupPhotoDetailResponse::from));
    }


    @DeleteMapping("/groups/{groupId}/photos")
    public ApiResponse<List<GroupPhotoIdResponse>> deleteGroupPhotos(@PathVariable Long groupId,
                                            @RequestBody GroupPhotoDeleteRequest request) {
        List<GroupPhotoDto> result = groupPhotoService.deleteGroupPhoto(groupId, request);
        return ApiResponse.created(GroupPhotoIdResponse.from(result));
    }

}
