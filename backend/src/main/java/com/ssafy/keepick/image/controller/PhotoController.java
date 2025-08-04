package com.ssafy.keepick.image.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhotoController {

    @GetMapping("/photos/random")
    public ApiResponse<?>  getRandomPhotos() {
        return null;
    }

    @GetMapping("/groups/{groupId}/photos")
    public ApiResponse<?>  getGroupPhotos(@PathVariable Long groupId) {
        return null;
    }

    @PostMapping("/groups/{groupId}/photos")
    public ApiResponse<?>  createGroupPhotos(@PathVariable Long groupId) {
        return null;
    }

    @PostMapping("/groups/{groupId}/photos")
    public ApiResponse<?> deleteGroupPhotos(@PathVariable Long groupId) {
        return null;
    }

}
