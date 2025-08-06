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
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumListDto;
import com.ssafy.keepick.album.tier.application.dto.TierAlbumDetailDto;
import com.ssafy.keepick.album.tier.controller.request.CreateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumListResponse;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumDetailResponse;
import com.ssafy.keepick.global.response.ApiResponse;


import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "티어 앨범 목록 조회", description = "그룹의 티어 앨범 목록을 조회합니다.")
    public ApiResponse<TierAlbumListResponse> getTierAlbumList(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
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
                .build())
            .toList();

        TierAlbumListResponse response = TierAlbumListResponse.builder()
            .content(content)
            .pageInfo(tierAlbumListDto.getPageInfo())
            .build();
        
        return ApiResponse.ok(response);
    }

    @GetMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 상세 조회", description = "특정 티어 앨범의 상세 정보와 사진 목록을 조회합니다.")
    public ApiResponse<TierAlbumDetailResponse> getTierAlbum(@PathVariable Long tierAlbumId) {
        TierAlbumDetailDto tierAlbumDetailDto = tierAlbumService.getTierAlbumDetail(tierAlbumId);
        
        // DTO를 Response로 변환
        Map<String, List<TierAlbumDetailResponse.TierAlbumPhotoDto>> photosResponse = tierAlbumDetailDto.getPhotos().entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().stream()
                    .map(dto -> TierAlbumDetailResponse.TierAlbumPhotoDto.builder()
                        .photoId(dto.getPhotoId())
                        .thumbnailUrl(dto.getThumbnailUrl())
                        .originalUrl(dto.getOriginalUrl())
                        .sequence(dto.getSequence())
                        .build())
                    .toList()
            ));
        
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
    @Operation(summary = "티어 앨범 생성", description = "새로운 티어 앨범을 생성합니다.")
    public ApiResponse<TierAlbumDto> createTierAlbum(
            @PathVariable Long groupId, 
            @Valid @RequestBody CreateTierAlbumRequest request) {
        TierAlbumDto tierAlbumDto = tierAlbumService.createTierAlbum(groupId, request.getPhotoIds());
        return ApiResponse.ok(tierAlbumDto);
    }

    @PutMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 수정", description = "티어 앨범 정보를 수정합니다.")
    public ApiResponse<TierAlbumDto> updateTierAlbum(
            @PathVariable Long tierAlbumId, 
            @Valid @RequestBody UpdateTierAlbumRequest request) {
        TierAlbumDto updatedTierAlbumDto = tierAlbumService.updateTierAlbum(tierAlbumId, request);
        return ApiResponse.ok(updatedTierAlbumDto);
    }

    @DeleteMapping("/{tierAlbumId}")
    @Operation(summary = "티어 앨범 삭제", description = "티어 앨범을 삭제합니다.")
    public ApiResponse<Void> deleteTierAlbum(@PathVariable Long tierAlbumId) {
        tierAlbumService.deleteTierAlbum(tierAlbumId);
        return ApiResponse.ok(null);
    }
}
