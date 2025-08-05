package com.ssafy.keepick.timeline.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.timeline.application.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/timeline-albums")
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("")
    public ApiResponse<?> getTimelineAlbums() {
        return null;
    }

    @PostMapping("")
    public ApiResponse<?> createTimelineAlbum() {
        return null;
    }

    @GetMapping("/{albumId}")
    public ApiResponse<?> getTimelineAlbum() {
        return null;
    }

    @DeleteMapping("/{albumId}")
    public ApiResponse<?> deleteTimelineAlbum() {
        return null;
    }

    @PutMapping("/{albumId}")
    public ApiResponse<?> updateTimelineAlbum() {
        return null;
    }

}
