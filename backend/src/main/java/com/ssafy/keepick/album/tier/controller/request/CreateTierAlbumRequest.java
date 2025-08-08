package com.ssafy.keepick.album.tier.controller.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "티어 앨범 생성 요청")
public class CreateTierAlbumRequest {
    
    @NotEmpty(message = "포함할 사진은 최소 1개 이상이어야 합니다.")
    @Schema(
        description = "포함할 사진들의 ID 리스트 (최소 1개 이상)", 
        example = "[1, 2, 3, 4, 5, 6]"
    )
    private List<Long> photoIds;
}
