package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.global.response.ResponseCode;
import com.ssafy.keepick.timeline.application.TimelineInteractionService;
import com.ssafy.keepick.timeline.application.TimelineService;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumPhotoDto;
import com.ssafy.keepick.timeline.controller.request.TimelineCreateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelinePhotoRequest;
import com.ssafy.keepick.timeline.controller.response.TimelineCreateResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineDetailResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineInfoResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/timeline-albums")
@Tag(name="Timeline", description = "타임라인 앨범 관련 API")
public class TimelineController {

    private final TimelineService timelineService;
    private final TimelineInteractionService timelineInteractionService;

    @Operation(summary = "타임라인 앨범 목록 조회", description = "특정 그룹에 속한 타임라인 앨범 목록을 조회합니다.")
    @GetMapping("")
    public ApiResponse<PagingResponse<TimelineInfoResponse>> getTimelineAlbumList(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<TimelineAlbumDto> albumDtoPage = timelineService.getTimelineAlbumList(groupId, page, size);
        PagingResponse<TimelineInfoResponse> response = PagingResponse.from(albumDtoPage, TimelineInfoResponse::toResponse);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "타임라인 앨범 생성", description = "앨범에 사용할 사진 목록을 받아서 빈 타임라인 앨범을 생성합니다.")
    @PostMapping("")
    public ApiResponse<TimelineCreateResponse> createTimelineAlbum(@PathVariable Long groupId, @Valid @RequestBody TimelineCreateRequest request) {
        TimelineAlbumDto albumDto = timelineInteractionService.createTimelineAlbum(groupId, request);
        TimelineCreateResponse response = TimelineCreateResponse.toResponse(albumDto);
        return ApiResponse.created(response);
    }

    @Operation(summary = "타임라인 앨범 상세 조회", description = "특정 타임라인 앨범의 기본 정보, 섹션 목록, 사진 목록을 포함한 상세 정보를 조회합니다.")
    @GetMapping("/{albumId}")
    public ApiResponse<TimelineDetailResponse> getTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId) {
        TimelineAlbumDto timelineAlbumDto = timelineService.getTimelineAlbum(groupId, albumId);
        TimelineDetailResponse response = TimelineDetailResponse.toResponse(timelineAlbumDto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "타임라인 앨범 삭제", description = "특정 타임라인 앨범을 삭제합니다.")
    @DeleteMapping("/{albumId}")
    public ApiResponse<Void> deleteTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId) {
        timelineInteractionService.deleteTimelineAlbum(groupId, albumId);
        return ApiResponse.of(ResponseCode.DELETED);
    }

    @Operation(summary = "타임라인 앨범 수정", description = "특정 타임라인 앨범을 수정합니다. 타임라인 앨범의 기본 정보, 섹션 목록, 사용하지 않은 사진 ID 목록, 삭제할 사진 ID 목록을 받아서 앨범을 수정합니다.")
    @PutMapping("/{albumId}")
    public ApiResponse<TimelineInfoResponse> updateTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId, @Valid @RequestBody TimelineUpdateRequest request) {
        TimelineAlbumDto timelineAlbumDto = timelineInteractionService.updateTimelineAlbum(groupId, albumId, request);
        TimelineInfoResponse response = TimelineInfoResponse.toResponse(timelineAlbumDto);
        return ApiResponse.ok(response);
    }

    @Operation(summary = "타임라인 앨범에 사진 업로드", description = "특정 타임라인 앨범에 사진을 업로드합니다.")
    @PostMapping("/{albumId}/photos")
    public ApiResponse<List<TimelineUploadResponse>> uploadPhotoToTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId, @Valid @RequestBody TimelinePhotoRequest request) {
        List<TimelineAlbumPhotoDto> timelineAlbumPhotoDtos = timelineInteractionService.addPhotoToTimelineAlbum(groupId, albumId, request);
        List<TimelineUploadResponse> response = timelineAlbumPhotoDtos.stream().map(TimelineUploadResponse::toResponse).toList();
        return ApiResponse.ok(response);
    }

    @Operation(summary = "타임라인 앨범에 사진 삭제", description = "특정 타임라인 앨범에서 사진을 삭제합니다.")
    @DeleteMapping("/{albumId}/photos")
    public ApiResponse<List<TimelineUploadResponse>> deletePhotoFromTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId, @Valid @RequestBody TimelinePhotoRequest request) {
        timelineInteractionService.deletePhotoFromTimelineAlbum(groupId, albumId, request);
        return ApiResponse.of(ResponseCode.DELETED);
    }

}
