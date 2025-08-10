package com.ssafy.keepick.album.tier.controller;

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
import com.ssafy.keepick.album.tier.application.dto.TierAlbumPhotoDto;
import com.ssafy.keepick.album.tier.controller.request.CreateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.request.TierPhotoDeleteRequest;
import com.ssafy.keepick.album.tier.controller.request.TierPhotoUploadRequest;
import com.ssafy.keepick.album.tier.controller.request.UpdateTierAlbumRequest;
import com.ssafy.keepick.album.tier.controller.response.TierAlbumDetailResponse;
import com.ssafy.keepick.album.tier.controller.response.TierPhotoUploadResponse;
import com.ssafy.keepick.global.response.ApiResponse;
import com.ssafy.keepick.global.response.PagingResponse;
import com.ssafy.keepick.global.response.ResponseCode;

import java.util.List;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups/{groupId}/tier-albums")
public class TierAlbumController implements TierAlbumApi {
    private final TierAlbumService tierAlbumService;

    @Override
    @GetMapping("")
    public ApiResponse<PagingResponse<TierAlbumDto>> getTierAlbumList(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagingResponse<TierAlbumDto> response = tierAlbumService.getTierAlbumListWithPaging(groupId, page, size);
        return ApiResponse.ok(response);
    }

    @Override
    @GetMapping("/{tierAlbumId}")
    public ApiResponse<TierAlbumDetailResponse> getTierAlbum(
            @PathVariable Long groupId,
            @PathVariable Long tierAlbumId) {
        TierAlbumDetailDto tierAlbumDetailDto = tierAlbumService.getTierAlbumDetail(groupId, tierAlbumId);

        // DTO를 Response로 변환
        TierAlbumDetailResponse response = tierAlbumDetailDto.toResponse();

        return ApiResponse.ok(response);
    }

    @Override
    @PostMapping("")
    public ApiResponse<Long> createTierAlbum(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateTierAlbumRequest request) {
        TierAlbumDto tierAlbumDto = tierAlbumService.createTierAlbum(groupId, request.getPhotoIds());
        return ApiResponse.ok(tierAlbumDto.getId());
    }

    @Override
    @PutMapping("/{tierAlbumId}")
    public ApiResponse<Void> updateTierAlbum(
            @PathVariable Long groupId,
            @PathVariable Long tierAlbumId,
            @Valid @RequestBody UpdateTierAlbumRequest request) {
        tierAlbumService.updateTierAlbum(groupId, tierAlbumId, request);
        return ApiResponse.ok(null);
    }

    @Override
    @DeleteMapping("/{tierAlbumId}")
    public ApiResponse<Void> deleteTierAlbum(
            @PathVariable Long groupId,
            @PathVariable Long tierAlbumId) {
        tierAlbumService.deleteTierAlbum(groupId, tierAlbumId);
        return ApiResponse.ok(null);
    }

    @Override
    @PostMapping("/{tierAlbumId}/photos")
    public ApiResponse<TierPhotoUploadResponse> uploadPhotoToTierAlbum(
            @PathVariable Long groupId,
            @PathVariable Long tierAlbumId,
            @Valid @RequestBody TierPhotoUploadRequest request) {
        List<TierAlbumPhotoDto> tierAlbumPhotoDtos = tierAlbumService.uploadPhotoToTierAlbum(groupId, tierAlbumId, request.getPhotoIds());
        TierPhotoUploadResponse response = TierAlbumPhotoDto.toResponse(tierAlbumPhotoDtos);
        return ApiResponse.ok(response);
    }

    @Override
    @DeleteMapping("/{tierAlbumId}/photos")
    public ApiResponse<Void> deletePhotoFromTierAlbum(
            @PathVariable Long groupId,
            @PathVariable Long tierAlbumId,
            @Valid @RequestBody TierPhotoDeleteRequest request) {
        tierAlbumService.deletePhotoFromTierAlbum(groupId, tierAlbumId, request.getPhotoIds());
        return ApiResponse.of(ResponseCode.DELETED);
    }
}
