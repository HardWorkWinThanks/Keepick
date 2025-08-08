package com.ssafy.keepick.album.common.controller;

import com.ssafy.keepick.album.common.application.AlbumService;
import com.ssafy.keepick.album.common.application.dto.AlbumDto;
import com.ssafy.keepick.album.common.controller.response.AlbumResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/albums")
@Tag(name = "Album", description = "전체 앨범 API")
public class AlbumController {

    private final AlbumService albumService;

    @Operation(summary = "전체 앨범 목록 조회", description = "특정 그룹의 타임라인, 티어, 하이라이트 앨범 목록을 조회합니다.")
    @GetMapping("")
    public ApiResponse<AlbumResponse> getAllAlbums(@PathVariable Long groupId) {
        AlbumDto albumDto = albumService.getAllAlbumList(groupId);
        AlbumResponse response = AlbumResponse.from(albumDto);
        return ApiResponse.ok(response);
    }

}
