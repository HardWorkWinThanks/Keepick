package com.ssafy.keepick.album.tier.controller.request;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateTierAlbumRequest {
    
    private String name;
    private String description;
    private Long thumbnailId;
    private Map<String, List<Long>> photos; // 티어별 사진 ID 리스트
}
