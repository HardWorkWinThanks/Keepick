package com.ssafy.keepick.album.tier.controller.response;

import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Getter;
import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Builder
@Schema(description = "티어 앨범 상세 응답")
public class TierAlbumDetailResponse {
    @Schema(description = "앨범 제목", example = "여름 휴가 앨범")
    private String title;
    
    @Schema(description = "앨범 설명", example = "2024년 여름 휴가 사진들")
    private String description;
    
    @Schema(description = "썸네일 이미지 URL", example = "https://example.com/thumb.jpg")
    private String thumbnailUrl;
    
    @Schema(description = "원본 이미지 URL", example = "https://example.com/original.jpg")
    private String originalUrl;
    
    @Schema(description = "앨범에 포함된 총 사진 개수", example = "6")
    private Integer photoCount;
    
    @Schema(description = "티어별로 그룹화된 사진 목록 (S, A, B, C, D, UNASSIGNED)")
    private Map<String, List<Photo>> photos; // 티어별로 그룹화

    // Entity 변환 로직은 서비스 계층 DTO에서 처리하므로 제거

    // Entity 변환 로직은 서비스 계층 DTO에서 처리하므로 제거

    @Getter
    @Builder
    @Schema(description = "티어 앨범 사진 정보")
    public static class Photo {
        @Schema(description = "사진 ID", example = "1")
        private Long photoId;
        
        @Schema(description = "썸네일 이미지 URL", example = "https://example.com/thumb1.jpg")
        private String thumbnailUrl;
        
        @Schema(description = "원본 이미지 URL", example = "https://example.com/original1.jpg")
        private String originalUrl;
        
        @Schema(description = "앨범 내 사진 순서", example = "0")
        private Integer sequence;
    }
}
