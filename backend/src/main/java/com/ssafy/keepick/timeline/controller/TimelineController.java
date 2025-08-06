package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.image.application.dto.GroupPhotoDto;
import com.ssafy.keepick.image.controller.response.GroupPhotoDetailResponse;
import com.ssafy.keepick.timeline.application.TimelineService;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.controller.response.TimelineDetailResponse;
import com.ssafy.keepick.timeline.controller.response.TimelineInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/timeline-albums")
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("")
    public ApiResponse<?> getTimelineAlbumList(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<TimelineAlbumDto> albumDtoPage = timelineService.getTimelineAlbumList(groupId, page, size);
        PagingResponse<TimelineInfoResponse> response = PagingResponse.from(albumDtoPage, TimelineInfoResponse::toResponse);
        return ApiResponse.ok(response);
    }

    @PostMapping("")
    public ApiResponse<?> createTimelineAlbum(@PathVariable Long groupId) {
        return null;
    }

    @GetMapping("/{albumId}")
    public ApiResponse<TimelineDetailResponse> getTimelineAlbum(@PathVariable Long albumId) {
        TimelineAlbumDto timelineAlbumDto = timelineService.getTimelineAlbum(albumId);
        TimelineDetailResponse response = TimelineDetailResponse.toResponse(timelineAlbumDto);
        return ApiResponse.ok(response);
    }

    @DeleteMapping("/{albumId}")
    public ApiResponse<?> deleteTimelineAlbum(@PathVariable Long albumId) {
        return null;
    }

    @PutMapping("/{albumId}")
    public ApiResponse<?> updateTimelineAlbum(@PathVariable Long albumId) {
        return null;
    }

}
