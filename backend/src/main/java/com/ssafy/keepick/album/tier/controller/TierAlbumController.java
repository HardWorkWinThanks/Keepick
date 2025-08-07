package com.ssafy.keepick.album.tier.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ssafy.keepick.album.tier.application.TierAlbumService;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.controller.request.CreateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumDetailResponse;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumListResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/tier-albums")
@Tag(name = "Tier Album", description = "티어 앨범 API")
public class TierAlbumController {
    private final TierAlbumService tierAlbumService;

    @GetMapping("")
    @Operation(summary = "티어 앨범 목록 조회", description = "특정 그룹의 티어 앨범 목록을 페이징하여 조회합니다. " +
            "각 앨범의 기본 정보(이름, 설명, 썸네일, 사진 개수)를 포함합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 목록 조회 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TierAlbumListResponse.class), examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "success",
                        "data": {
                            "content": [
                                {
                                    "id": 1,
                                    "name": "여름 휴가 앨범",
                                    "description": "2024년 여름 휴가 사진들",
                                    "thumbnailUrl": "https://example.com/thumb1.jpg",
                                    "originalUrl": "https://example.com/original1.jpg",
                                    "photoCount": 15,
                                    "createdAt": "2024-01-15T10:30:00",
                                    "updatedAt": "2024-01-15T14:45:00"
                                }
                            ],
                            "pageInfo": {
                                "page": 0,
                                "size": 10,
                                "totalElement": 1,
                                "totalPage": 1,
                                "hasNext": false
                            }
                        }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (잘못된 그룹 ID, 음수 페이지 번호 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "실패 응답 예시", value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "그룹을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "그룹 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 그룹입니다.",
                        "errorCode": "G001",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    public ApiResponse<TierAlbumListResponse> getTierAlbumList(
            @Parameter(description = "그룹 ID", example = "1", required = true) @PathVariable Long groupId,
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0", schema = @Schema(defaultValue = "0", minimum = "0")) @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지당 항목 수", example = "10", schema = @Schema(defaultValue = "10", minimum = "1", maximum = "100")) @RequestParam(defaultValue = "10") int size) {
        TierAlbumListDto tierAlbumListDto = tierAlbumService.getTierAlbumListWithPaging(groupId, page, size);

        // DTO를 TierAlbumListResponse로 변환
        List<TierAlbumListResponse.TierAlbumContent> content = tierAlbumListDto.getAlbums().stream()
                .map(album -> TierAlbumListResponse.TierAlbumContent.builder()
                        .id(album.getId())
                        .name(album.getName())
                        .description(album.getDescription())
                        .thumbnailUrl(album.getThumbnailUrl())
                        .originalUrl(album.getOriginalUrl())
                        .photoCount(album.getPhotoCount())
                        .createdAt(album.getCreatedAt())
                        .updatedAt(album.getUpdatedAt())
                        .build())
                .toList();

        TierAlbumListResponse response = TierAlbumListResponse.builder()
                .content(content)
                .pageInfo(tierAlbumListDto.getPageInfo())
                .build();

        return ApiResponse.ok(response);
    }

    @GetMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 상세 조회", description = "특정 티어 앨범의 상세 정보와 사진 목록을 조회합니다. " +
            "사진들은 S, A, B, C, D, UNASSIGNED 등급별로 그룹화되어 반환됩니다. " +
            "각 등급에 사진이 없어도 빈 배열로 반환됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 상세 조회 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TierAlbumDetailResponse.class), examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": {
                            "title": "여름 휴가 앨범",
                            "description": "2024년 여름 휴가 사진들",
                            "thumbnailUrl": "https://example.com/thumb.jpg",
                            "originalUrl": "https://example.com/original.jpg",
                            "photoCount": 6,
                            "photos": {
                                "S": [
                                    {
                                        "photoId": 1,
                                        "thumbnailUrl": "https://example.com/thumb1.jpg",
                                        "originalUrl": "https://example.com/original1.jpg",
                                        "sequence": 0
                                    }
                                ],
                                "A": [
                                    {
                                        "photoId": 2,
                                        "thumbnailUrl": "https://example.com/thumb2.jpg",
                                        "originalUrl": "https://example.com/original2.jpg",
                                        "sequence": 1
                                    },
                                    {
                                        "photoId": 3,
                                        "thumbnailUrl": "https://example.com/thumb3.jpg",
                                        "originalUrl": "https://example.com/original3.jpg",
                                        "sequence": 2
                                    }
                                ],
                                "B": [],
                                "C": [
                                    {
                                        "photoId": 4,
                                        "thumbnailUrl": "https://example.com/thumb4.jpg",
                                        "originalUrl": "https://example.com/original4.jpg",
                                        "sequence": 3
                                    }
                                ],
                                "D": [],
                                "UNASSIGNED": [
                                    {
                                        "photoId": 5,
                                        "thumbnailUrl": "https://example.com/thumb5.jpg",
                                        "originalUrl": "https://example.com/original5.jpg",
                                        "sequence": 4
                                    },
                                    {
                                        "photoId": 6,
                                        "thumbnailUrl": "https://example.com/thumb6.jpg",
                                        "originalUrl": "https://example.com/original6.jpg",
                                        "sequence": 5
                                    }
                                ]
                            }
                        }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (잘못된 그룹 ID, 티어 앨범 ID 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "잘못된 요청 예시", value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "접근 권한 없음 (그룹 멤버가 아님, 앨범이 다른 그룹에 속함)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "권한 없음 예시", value = """
                    {
                        "status": 403,
                        "message": "접근 권한이 없습니다.",
                        "errorCode": "F001",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "그룹 또는 티어 앨범을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "그룹 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 그룹입니다.",
                        "errorCode": "G001",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    public ApiResponse<TierAlbumDetailResponse> getTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) @PathVariable Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) @PathVariable Long tierAlbumId) {
        TierAlbumDetailDto tierAlbumDetailDto = tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId);

        // DTO를 Response로 변환
        Map<String, List<TierAlbumDetailResponse.TierAlbumPhotoDto>> photosResponse = tierAlbumDetailDto.getPhotos()
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(dto -> TierAlbumDetailResponse.TierAlbumPhotoDto.builder()
                                        .photoId(dto.getPhotoId())
                                        .thumbnailUrl(dto.getThumbnailUrl())
                                        .originalUrl(dto.getOriginalUrl())
                                        .sequence(dto.getSequence())
                                        .build())
                                .toList()));

        TierAlbumDetailResponse response = TierAlbumDetailResponse.builder()
                .title(tierAlbumDetailDto.getTitle())
                .description(tierAlbumDetailDto.getDescription())
                .thumbnailUrl(tierAlbumDetailDto.getThumbnailUrl())
                .originalUrl(tierAlbumDetailDto.getOriginalUrl())
                .photoCount(tierAlbumDetailDto.getPhotoCount())
                .photos(photosResponse)
                .build();

        return ApiResponse.ok(response);
    }

    @PostMapping("")
    @Operation(summary = "티어 앨범 생성", description = "새로운 티어 앨범을 생성합니다. 포함할 사진들의 ID 리스트를 받아서 빈 티어 앨범을 생성합니다. 생성된 티어 앨범의 ID를 반환합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 생성 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": 1
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (빈 사진 리스트, 잘못된 그룹 ID 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "빈 사진 리스트 예시", value = """
                    {
                        "status": 400,
                        "message": "포함할 사진은 최소 1개 이상이어야 합니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "사진을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "사진 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "리소스를 찾을 수 없습니다.",
                        "errorCode": "B003",
                        "timeStamp": "2025-08-07T14:47:50.902147"
                    }
                    """)))
    })
    public ApiResponse<Long> createTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) @PathVariable Long groupId,
            @Parameter(description = "티어 앨범 생성 요청", required = true) @Valid @RequestBody CreateTierAlbumRequest request) {
        TierAlbumDto tierAlbumDto = tierAlbumService.createTierAlbum(groupId, request.getPhotoIds());
        return ApiResponse.ok(tierAlbumDto.getId());
    }

    @PutMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 수정", description = "티어 앨범의 이름, 설명, 썸네일, 사진들의 티어 배치를 수정합니다. " +
            "사진들의 티어를 변경할 수 있으며, 각 티어별로 사진 ID 리스트를 제공합니다. " +
            "UNASSIGNED도 요청에서 받을 수 있으며, 각 티어 내에서 요청 순서대로 sequence가 설정됩니다. " +
            "앨범에 포함된 모든 사진을 요청에 포함해야 하며, 앨범에 없는 사진을 요청에 포함할 수 없습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 수정 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": null
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (빈 이름, 잘못된 사진 ID 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "빈 이름 예시", value = """
                    {
                        "status": 400,
                        "message": "앨범 이름은 필수입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "티어 앨범을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "티어 앨범 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 티어 앨범입니다.",
                        "errorCode": "B003",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    public ApiResponse<Void> updateTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) @PathVariable Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) @PathVariable Long tierAlbumId,
            @Parameter(description = "티어 앨범 수정 요청", required = true) @Valid @RequestBody UpdateTierAlbumRequest request) {
        tierAlbumService.updateTierAlbum(groupId, tierAlbumId, request);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 삭제", description = "특정 티어 앨범을 삭제합니다. 삭제 시 해당 앨범의 모든 사진과 티어 정보가 함께 삭제됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 삭제 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": null
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (잘못된 그룹 ID, 티어 앨범 ID 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "잘못된 요청 예시", value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "티어 앨범을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "티어 앨범 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 티어 앨범입니다.",
                        "errorCode": "B003",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    public ApiResponse<Void> deleteTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) @PathVariable Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) @PathVariable Long tierAlbumId) {
        tierAlbumService.deleteTierAlbum(tierAlbumId);
        return ApiResponse.ok(null);
    }
}
