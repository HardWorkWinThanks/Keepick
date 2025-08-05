package com.ssafy.keepick.image.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.image.application.GroupPhotoService;
import com.ssafy.keepick.image.application.dto.GroupPhotoDto;
import com.ssafy.keepick.image.controller.request.GroupPhotoCreateRequest;
import com.ssafy.keepick.image.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.image.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.image.controller.response.GroupPhotoDetailResponse;
import com.ssafy.keepick.image.controller.response.GroupPhotoIdResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhotoController {
    private final GroupPhotoService groupPhotoService;

    @GetMapping("/photos/random")
    public ApiResponse<List<GroupPhotoDetailResponse>>  getRandomPhotos() {
        return null;
    }

    @GetMapping("/groups/{groupId}/photos")
    public ApiResponse<PagingResponse<GroupPhotoDetailResponse>>  getGroupPhotos(
            @PathVariable Long groupId,
            @ModelAttribute GroupPhotoSearchRequest request) {
        Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(groupId, request);
        return ApiResponse.ok(PagingResponse.from(result, GroupPhotoDetailResponse::from));
    }

    @PostMapping("/groups/{groupId}/photos")
    public ApiResponse<List<GroupPhotoDetailResponse>> createGroupPhotos(@PathVariable Long groupId,
                                            @RequestBody List<GroupPhotoCreateRequest> request) {
        List<GroupPhotoDto> result = groupPhotoService.createGroupPhoto(groupId, request);
        return ApiResponse.created(GroupPhotoDetailResponse.from(result));
    }

    @DeleteMapping("/groups/{groupId}/photos")
    public ApiResponse<List<GroupPhotoIdResponse>> deleteGroupPhotos(@PathVariable Long groupId,
                                            @RequestBody GroupPhotoDeleteRequest request) {
        List<GroupPhotoDto> result = groupPhotoService.deleteGroupPhoto(groupId, request);
        return ApiResponse.created(GroupPhotoIdResponse.from(result));
    }

}
