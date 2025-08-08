package com.ssafy.keepick.album.common.controller;

import com.ssafy.keepick.album.common.application.AlbumService;
import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.common.controller.response.AlbumResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/albums")
public class AlbumController {

    private final AlbumService albumService;

    @GetMapping("")
    public ApiResponse<AlbumResponse> getAllAlbums(@PathVariable Long groupId) {
        AlbumDto albumDto = albumService.getAllAlbumList(groupId);
        AlbumResponse response = AlbumResponse.from(albumDto);
        return ApiResponse.ok(response);
    }

}
