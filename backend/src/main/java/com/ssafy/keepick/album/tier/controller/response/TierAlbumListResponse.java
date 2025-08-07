package com.ssafy.keepick.album.tier.controller.response;

import java.time.LocalDateTime;
import java.util.List;

import com.ssafy.keepick.global.response.PagingResponse;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "티어 앨범 목록 조회 응답")
public class TierAlbumListResponse {
    @Schema(description = "티어 앨범 목록", example = "[]")
    private List<TierAlbumContent> content;
    
    @Schema(description = "페이징 정보")
    private PagingResponse.PageInfo pageInfo;
    
    @Getter
    @Builder
    @Schema(description = "티어 앨범 정보")
    public static class TierAlbumContent {
        @Schema(description = "앨범 ID", example = "1")
        private Long id;
        
        @Schema(description = "앨범 이름", example = "여름 휴가 앨범")
        private String name;
        
        @Schema(description = "앨범 설명", example = "2024년 여름 휴가 사진들")
        private String description;
        
        @Schema(description = "썸네일 이미지 URL", example = "https://example.com/thumb1.jpg")
        private String thumbnailUrl;
        
        @Schema(description = "원본 이미지 URL", example = "https://example.com/original1.jpg")
        private String originalUrl;
        
        @Schema(description = "포함된 사진 개수", example = "15")
        private Integer photoCount;
        
        @Schema(description = "생성일시", example = "2024-01-15T10:30:00")
        private LocalDateTime createdAt;
        
        @Schema(description = "수정일시", example = "2024-01-15T14:45:00")
        private LocalDateTime updatedAt;
    }
}
