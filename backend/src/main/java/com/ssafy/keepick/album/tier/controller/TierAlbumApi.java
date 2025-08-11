package com.ssafy.keepick.album.tier.controller;

import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.controller.request.CreateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.request.TierPhotoDeleteRequest;
import com.ssafy.keepick.album.tier.controller.request.TierPhotoUploadRequest;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumDetailResponse;
import com.ssafy.keepick.album.tier.controller.response.TierPhotoUploadResponse;
import com.ssafy.keepick.global.exception.ErrorResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "Tier Album", description = "티어 앨범 API")
public interface TierAlbumApi {

    @Operation(summary = "티어 앨범 목록 조회", description = "특정 그룹의 티어 앨범 목록을 페이징하여 조회합니다. " +
            "각 앨범의 기본 정보(이름, 설명, 썸네일, 사진 개수)를 포함합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 목록 조회 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "success",
                        "data": {
                            "list": [
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
    ApiResponse<PagingResponse<TierAlbumDto>> getTierAlbumList(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "페이지 번호 (1부터 시작)", example = "1", schema = @Schema(defaultValue = "1", minimum = "1")) int page,
            @Parameter(description = "페이지당 항목 수", example = "10", schema = @Schema(defaultValue = "10", minimum = "1", maximum = "100")) int size);

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
                                "D": []
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
    ApiResponse<TierAlbumDetailResponse> getTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) Long tierAlbumId);

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
    ApiResponse<Long> createTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 생성 요청", required = true) @Valid CreateTierAlbumRequest request);

    @Operation(summary = "티어 앨범 수정", description = "티어 앨범의 이름, 설명, 썸네일, 사진들의 티어 배치를 수정합니다. " +
            "사진들의 티어를 변경할 수 있으며, 각 티어별로 사진 ID 리스트를 제공합니다. " +
            "명시적으로 할당되지 않은 사진은 자동으로 UNASSIGNED로 처리되며, 각 티어 내에서 요청 순서대로 sequence가 설정됩니다. " +
            "앨범에 없는 사진을 요청에 포함할 수 없습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "티어 앨범 수정 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": null
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
    ApiResponse<Void> updateTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) Long tierAlbumId,
            @Parameter(description = "티어 앨범 수정 요청", required = true) @Valid UpdateTierAlbumRequest request);

    @Operation(summary = "티어 앨범 삭제", description = "특정 티어 앨범을 삭제합니다. 삭제 시 해당 앨범의 모든 사진과 티어 정보가 함께 삭제됩니다. " +
            "Soft Delete가 적용되어 데이터베이스에서 실제로 삭제되지 않고 삭제 표시만 됩니다.")
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
    ApiResponse<Void> deleteTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) Long tierAlbumId);

    @Operation(summary = "티어 앨범에 사진 업로드", description = "특정 티어 앨범에 사진을 업로드합니다. 최대 20장까지 업로드 가능하며, 이미 앨범에 포함된 사진은 업로드할 수 없습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "사진 업로드 성공", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TierPhotoUploadResponse.class), examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": {
                            "photos": [
                                {
                                    "photoId": 1,
                                    "originalUrl": "https://example.com/original1.jpg",
                                    "thumbnailUrl": "https://example.com/thumb1.jpg"
                                }
                            ]
                        }
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (이미 앨범에 포함된 사진, 최대 20장 초과 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "이미 포함된 사진 예시", value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "그룹, 티어 앨범 또는 사진을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "앨범 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 티어 앨범입니다.",
                        "errorCode": "B003",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    ApiResponse<TierPhotoUploadResponse> uploadPhotoToTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) Long tierAlbumId,
            @Parameter(description = "사진 업로드 요청", required = true) @Valid TierPhotoUploadRequest request);

    @Operation(summary = "티어 앨범에서 사진 삭제", description = "특정 티어 앨범에서 사진을 삭제합니다. 앨범에 포함되지 않은 사진은 삭제할 수 없습니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "사진 삭제 성공", content = @Content(mediaType = "application/json", examples = @ExampleObject(name = "성공 응답 예시", value = """
                    {
                        "status": 200,
                        "message": "요청이 성공적으로 처리되었습니다.",
                        "data": null
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 요청 (앨범에 포함되지 않은 사진 등)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "잘못된 요청 예시", value = """
                    {
                        "status": 400,
                        "message": "잘못된 요청입니다.",
                        "errorCode": "B004",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "그룹, 티어 앨범 또는 사진을 찾을 수 없음", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class), examples = @ExampleObject(name = "앨범 없음 예시", value = """
                    {
                        "status": 404,
                        "message": "존재하지 않는 티어 앨범입니다.",
                        "errorCode": "B003",
                        "timeStamp": "2025-08-07T13:46:08.346331600"
                    }
                    """)))
    })
    ApiResponse<Void> deletePhotoFromTierAlbum(
            @Parameter(description = "그룹 ID", example = "1", required = true) Long groupId,
            @Parameter(description = "티어 앨범 ID", example = "1", required = true) Long tierAlbumId,
            @Parameter(description = "사진 삭제 요청", required = true) @Valid TierPhotoDeleteRequest request);
}
