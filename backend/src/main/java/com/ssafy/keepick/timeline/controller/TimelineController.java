package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.global.response.ResponseCode;
import com.ssafy.keepick.image.application.dto.GroupPhotoDto;
import com.ssafy.keepick.image.controller.response.GroupPhotoDetailResponse;
import com.ssafy.keepick.timeline.application.TimelineInteractionService;
import com.ssafy.keepick.timeline.application.TimelineService;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.controller.request.TimelineCreateRequest;
import com.ssafy.keepick.timeline.controller.request.TimelineUpdateRequest;
import com.ssafy.keepick.timeline.controller.response.TimelineCreateResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineDetailResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineInfoResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/timeline-albums")
public class TimelineController {

    private final TimelineService timelineService;
    private final TimelineInteractionService timelineInteractionService;

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

    @PostMapping("")
    public ApiResponse<TimelineCreateResponse> createTimelineAlbum(@PathVariable Long groupId, @Valid @RequestBody TimelineCreateRequest request) {
        TimelineAlbumDto albumDto = timelineInteractionService.createTimelineAlbum(groupId, request);
        TimelineCreateResponse response = TimelineCreateResponse.toResponse(albumDto);
        return ApiResponse.created(response);
    }

    @GetMapping("/{albumId}")
    public ApiResponse<TimelineDetailResponse> getTimelineAlbum(@PathVariable Long albumId) {
        TimelineAlbumDto timelineAlbumDto = timelineService.getTimelineAlbum(albumId);
        TimelineDetailResponse response = TimelineDetailResponse.toResponse(timelineAlbumDto);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{albumId}")
    public ApiResponse<Void> deleteTimelineAlbum(@PathVariable Long groupId, @PathVariable Long albumId) {
        timelineInteractionService.deleteTimelineAlbum(groupId, albumId);
        return ApiResponse.of(ResponseCode.DELETED);
    }

    @PutMapping("/{albumId}")
    public ApiResponse<TimelineInfoResponse> updateTimelineAlbum(@PathVariable Long albumId, @Valid @RequestBody TimelineUpdateRequest request) {
        TimelineAlbumDto timelineAlbumDto = timelineInteractionService.updateTimelineAlbum(albumId, request);
        TimelineInfoResponse response = TimelineInfoResponse.toResponse(timelineAlbumDto);
        return ApiResponse.ok(response);
    }

}
