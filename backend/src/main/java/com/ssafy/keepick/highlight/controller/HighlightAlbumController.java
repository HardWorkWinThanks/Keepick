package com.ssafy.keepick.highlight.controller;

import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.highlight.application.HighlightAlbumService;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import com.ssafy.keepick.highlight.controller.request.HighlightAlbumCreateRequest;
import com.ssafy.keepick.highlight.controller.request.HighlightAlbumUpdateRequest;
import com.ssafy.keepick.highlight.controller.request.HighlightScreenshotSaveRequest;
import com.ssafy.keepick.highlight.controller.response.HighlightAlbumResponse;
import com.ssafy.keepick.highlight.controller.response.HighlightAlbumSummaryResponse;
import com.ssafy.keepick.highlight.controller.response.HighlightScreenshotSaveResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/highlight-albums")
@RequiredArgsConstructor
@Tag(name="Highlight Album", description = "하이라이트 앨범 관련 API")
public class HighlightAlbumController {
    private final HighlightAlbumService highlightAlbumService;

    @PostMapping("/photos")
    @Operation(summary = "하이라이트 스크린샷 업로드", description = "화상채팅 중 감정이 감지되어 캡처된 사진의 S3 URL을 전달받아 저장합니다.")
    public ApiResponse<HighlightScreenshotSaveResponse> saveHighlightScreenshot(@PathVariable Long groupId,
                                                                                @RequestBody HighlightScreenshotSaveRequest request) {
        HighlightAlbumPhotoDto result = highlightAlbumService.saveHighlightScreenshot(groupId, request);
        return ApiResponse.created(HighlightScreenshotSaveResponse.from(result));
    }

    @PostMapping()
    @Operation(summary = "하이라이트 앨범 생성", description = """
            화상채팅 종료 후 감정이 감지된 참여자들의 스크린샷을 기반으로 하이라이트 앨범을 생성합니다.
            감정이 감지되지 않은 참여자는 앨범에 포함되지 않습니다.
            """)
    public ApiResponse<HighlightAlbumResponse> createHighlightAlbum(@PathVariable Long groupId,
                                                                    @RequestBody HighlightAlbumCreateRequest request) {
        HighlightAlbumDto result = highlightAlbumService.createHighlightAlbum(groupId, request);
        return ApiResponse.created(HighlightAlbumResponse.from(result));
    }

    @PutMapping("{albumId}")
    @Operation(summary = "하이라이트 앨범 수정", description = """
            특정 하이라이트 앨범의 제목, 설명, 대표사진을 수정하고, 지정된 사진들을 삭제합니다.
            새로운 사진 추가는 불가능합니다
            """)
    public ApiResponse<HighlightAlbumResponse> modifyHighlightAlbum(@PathVariable Long groupId,
                                                                    @PathVariable Long albumId,
                                                                    @RequestBody HighlightAlbumUpdateRequest request) {
        HighlightAlbumDto result = highlightAlbumService.updateHighlightAlbum(albumId, request);
        return ApiResponse.ok(HighlightAlbumResponse.from(result));
    }

    @DeleteMapping("{albumId}")
    @Operation(summary = "하이라이트 앨범 삭제", description = """
            지정된 하이라이트 앨범을 삭제합니다. 삭제된 앨범은 해당 그룹의 모든 참여자에게 더 이상 표시되지 않으며,
            앨범에 포함된 사진도 함께 삭제됩니다.
            """)
    public ApiResponse<HighlightAlbumResponse> deleteHighlightAlbum(@PathVariable Long groupId, @PathVariable Long albumId) {
        HighlightAlbumDto result = highlightAlbumService.deleteHighlightAlbum(groupId, albumId);
        return ApiResponse.ok(HighlightAlbumResponse.from(result));
    }

    @GetMapping()
    @Operation(summary = "하이라이트 앨범 목록 조회")
    public ApiResponse<HighlightAlbumSummaryResponse> getHighlightAlbums(@PathVariable Long groupId) {
        List<HighlightAlbumDto>  result = highlightAlbumService.getHighlightAlbumList(groupId);
        return ApiResponse.ok(HighlightAlbumSummaryResponse.from(result));
    }

    @GetMapping("{albumId}")
    @Operation(summary = "하이라이트 앨범 상세 조회")
    public ApiResponse<HighlightAlbumResponse> getHighlightAlbumDetail(@PathVariable Long groupId, @PathVariable Long albumId) {
        HighlightAlbumDto result = highlightAlbumService.getHighlightAlbum(groupId, albumId);
        return ApiResponse.ok(HighlightAlbumResponse.from(result));
    }
}
