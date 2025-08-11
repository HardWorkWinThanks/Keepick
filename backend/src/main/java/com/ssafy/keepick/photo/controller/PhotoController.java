package com.ssafy.keepick.photo.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.global.security.util.AuthenticationUtil;
import com.ssafy.keepick.photo.application.GroupPhotoService;
import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import com.ssafy.keepick.photo.application.dto.GroupPhotoOverviewDto;
import com.ssafy.keepick.photo.application.dto.PhotoClusterDto;
import com.ssafy.keepick.photo.application.dto.PhotoTagDto;
import com.ssafy.keepick.photo.controller.request.GroupPhotoDeleteRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoSearchRequest;
import com.ssafy.keepick.photo.controller.request.GroupPhotoUploadRequest;
import com.ssafy.keepick.photo.controller.response.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name="Photo", description = "그룹 사진 관련 API")
public class PhotoController {
    private final GroupPhotoService groupPhotoService;

    @Operation(summary = "랜덤 사진 조회 API", description = "사용자가 속한 그룹에 있는 사진 중 랜덤으로 n개를 반환합니다.")
    @GetMapping("/photos/random")
    public ApiResponse<List<GroupPhotoDetailResponse>> getRandomPhotos(@RequestParam(defaultValue = "10") int size) {
        Long memberId = AuthenticationUtil.getCurrentUserId();
        List<GroupPhotoDto> result = groupPhotoService.getRandomPhotos(memberId, size);
        return ApiResponse.ok(GroupPhotoDetailResponse.from(result));
    }

    @Operation(summary = "다수 이미지 업로드 요청 API", description = """
        이미지를 업로드할 수 있는 presigned URL을 반환하는 API입니다.
        URL에 photo ID를 포함시키기 위해, 먼저 메타데이터와 함께 비어 있는 photo 객체를 생성해 저장한 후 presigned URL을 발급합니다.
        """)
    @PostMapping("/groups/{groupId}/photos/presigned-urls")
    public ApiResponse<List<GroupPhotoUploadResponse>> generatePresignedUrls(
            @PathVariable Long groupId,
            @Valid @RequestBody GroupPhotoUploadRequest request) {
        List<String> result = groupPhotoService.uploadGroupPhoto(groupId, request);
        List<GroupPhotoUploadResponse> response = result.stream()
                .map(GroupPhotoUploadResponse::of)
                .collect(Collectors.toList());
        return ApiResponse.ok(response);
    }

    @Operation(summary = "그룹 갤러리 사진 필터링 조회 API", description = "그룹 갤러리의 사진 중 여러 필터링 조건을 적용해서 결과를 페이징하여 반환합니다.")
    @GetMapping("/groups/{groupId}/photos")
    public ApiResponse<PagingResponse<GroupPhotoDetailResponse>> getGroupPhotos(
            @PathVariable Long groupId,
            @ModelAttribute GroupPhotoSearchRequest request) {
        Page<GroupPhotoDto> result = groupPhotoService.getGroupPhotos(groupId, request);
        return ApiResponse.ok(PagingResponse.from(result, GroupPhotoDetailResponse::from));
    }

    @Operation(summary = "흐린 사진 조회 API", description = "그룹 갤러리의 사진 중 흐린 사진만 조회한 결과를 페이징하여 반환합니다.")
    @GetMapping("/groups/{groupId}/blurred")
    public ApiResponse<PagingResponse<GroupPhotoDetailResponse>> getBlurredPhotos(
            @PathVariable Long groupId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size
    ) {
        Page<GroupPhotoDto> result = groupPhotoService.getBlurredPhotos(groupId, page, size);
        return ApiResponse.ok(PagingResponse.from(result, GroupPhotoDetailResponse::from));
    }

    @Operation(summary = "유사 사진 묶음(클러스터) 조회 API", description = "그룹 갤러리의 사진 중 유사 사진 클러스터를 조회한 결과를 페이징하여 반환합니다.")
    @GetMapping("/groups/{groupId}/similar")
    public ApiResponse<PagingResponse<GroupPhotoSimilarClusterResponse>> getSimilarClusters(
            @PathVariable Long groupId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size
    ) {
        Page<PhotoClusterDto> result = groupPhotoService.getSimilarClusters(groupId, page, size);
        return ApiResponse.ok(PagingResponse.from(result, GroupPhotoSimilarClusterResponse::from));
    }

    @Operation(summary = "그룹 전체 사진, 흐린 사진, 유사 사진 묶음 조회 API", description = "그룹 갤러리 초기 화면 로딩을 위한 전체 사진, 흐린 사진, 유사 사진 묶음 일부를 조회한 결과를 페이징하여 반환합니다. (조회할 페이지 번호는 항상 0입니다.)")
    @GetMapping("/groups/{groupId}/photos/overview")
    public ApiResponse<GroupPhotoOverviewResponse> getGroupPhotosOverview(@PathVariable Long groupId, @RequestParam(defaultValue = "10") int size) {
        GroupPhotoOverviewDto result = groupPhotoService.getGroupPhotoOverview(groupId, size);
        return ApiResponse.ok(GroupPhotoOverviewResponse.from(result));
    }

    @Operation(summary = "그룹 사진 태그 조회 API", description = "그룹 내 특정 사진의 태그 목록, 인식된 회원 이름 목록을 조회합니다.")
    @GetMapping("/groups/{groupId}/photos/{photoId}/tags")
    public ApiResponse<GroupPhotoTagResponse> getGroupPhotoTags(@PathVariable Long groupId, @PathVariable Long photoId) {
        PhotoTagDto result = groupPhotoService.getGroupPhotoTags(groupId, photoId);
        return ApiResponse.ok(GroupPhotoTagResponse.from(result));
    }

    @Operation(summary = "그룹 사진 삭제 API", description = "앨범에 포함된 사진은 삭제되지 않습니다.")
    @DeleteMapping("/groups/{groupId}/photos")
    public ApiResponse<GroupPhotoDeleteResponse> deleteGroupPhotos(@PathVariable Long groupId, @RequestBody GroupPhotoDeleteRequest request) {
        List<GroupPhotoDto> result = groupPhotoService.deleteGroupPhoto(groupId, request);
        return ApiResponse.ok(GroupPhotoDeleteResponse.from(request.getPhotoIds(), result));
    }

}
