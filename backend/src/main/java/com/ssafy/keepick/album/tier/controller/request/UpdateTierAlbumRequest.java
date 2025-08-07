package com.ssafy.keepick.album.tier.controller.request;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Builder;

@Getter
@Builder
public class UpdateTierAlbumRequest {
    
    @NotBlank(message = "앨범 이름은 필수입니다.")
    private String name;
    private String description;
    private Long thumbnailId;
    private Map<String, List<Long>> photos; // 티어별 사진 ID 리스트
}
