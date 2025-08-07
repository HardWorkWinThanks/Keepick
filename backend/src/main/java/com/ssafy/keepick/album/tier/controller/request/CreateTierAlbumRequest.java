package com.ssafy.keepick.album.tier.controller.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CreateTierAlbumRequest {
    
    @NotEmpty(message = "포함할 사진은 최소 1개 이상이어야 합니다.")
    private List<Long> photoIds;
}
