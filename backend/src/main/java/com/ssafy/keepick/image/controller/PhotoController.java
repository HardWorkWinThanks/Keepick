package com.ssafy.keepick.image.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.image.application.GroupPhotoService;
import com.ssafy.keepick.image.application.dto.GroupPhotoDto;
import com.ssafy.keepick.image.controller.request.GroupPhotoCreateRequest;
import com.ssafy.keepick.image.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.image.controller.response.GroupPhotoDetailResponse;
import com.ssafy.keepick.image.controller.response.GroupPhotoIdResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhotoController {
    private final GroupPhotoService groupPhotoService;

    @GetMapping("/photos/random")
    public ApiResponse<?>  getRandomPhotos() {
        return null;
    }

    @GetMapping("/groups/{groupId}/photos")
    public ApiResponse<?>  getGroupPhotos(@PathVariable Long groupId) {
        return null;
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
