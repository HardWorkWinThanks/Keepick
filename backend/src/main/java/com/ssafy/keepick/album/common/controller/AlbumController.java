package com.ssafy.keepick.album.common.controller;

import com.ssafy.keepick.album.common.controller.response.AlbumResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/albums")
public class AlbumController {

    @GetMapping("")
    public ApiResponse<AlbumResponse> getAllAlbums(@PathVariable Long groupIds) {

    }

}
