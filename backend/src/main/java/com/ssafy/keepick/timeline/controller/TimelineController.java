package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.timeline.application.TimelineService;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import com.ssafy.keepick.timeline.controller.response.TimelineDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/timeline-albums")
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("")
    public ApiResponse<?> getTimelineAlbumList(@PathVariable Long groupId) {
        return null;
    }

    @PostMapping("")
    public ApiResponse<?> createTimelineAlbum(@PathVariable Long groupId) {
        return null;
    }

    @GetMapping("/{albumId}")
    public ApiResponse<?> getTimelineAlbum(@PathVariable Long albumId) {
        TimelineAlbumDto dto = timelineService.getTimelineAlbum(albumId);
        TimelineDetailResponse response = TimelineDetailResponse.toResponse(dto);
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
