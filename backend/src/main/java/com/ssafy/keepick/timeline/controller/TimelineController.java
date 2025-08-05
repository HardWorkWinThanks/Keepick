package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.timeline.application.TimelineService;
import com.ssafy.keepick.timeline.application.dto.TimelineAlbumDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
        return null;
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
