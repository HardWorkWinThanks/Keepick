package com.ssafy.keepick.album.tier.controller.response;

import java.util.List;

import com.ssafy.keepick.global.response.PagingResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TierAlbumListResponse {
    private List<TierAlbumContent> content;
    private PagingResponse.PageInfo pageInfo;
    
    @Getter
    @Builder
    public static class TierAlbumContent {
        private Long id;
        private String name;
        private String description;
        private String thumbnailUrl;
        private String originalUrl;
        private Integer photoCount;
    }
}
