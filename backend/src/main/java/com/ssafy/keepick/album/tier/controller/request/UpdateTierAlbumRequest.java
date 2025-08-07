package com.ssafy.keepick.album.tier.controller.request;

import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "티어 앨범 수정 요청")
public class UpdateTierAlbumRequest {
    
    @Schema(
        description = "앨범 이름",
        example = "여름 휴가 앨범"
    )
    private String name;
    
    @Schema(
        description = "앨범 설명",
        example = "2024년 여름 휴가 사진들"
    )
    private String description;
    
    @Schema(
        description = "썸네일로 사용할 사진의 ID",
        example = "1"
    )
    private Long thumbnailId;
    
    @Schema(
        description = "티어별 사진 ID 리스트 (S, A, B, C, D, UNASSIGNED)",
        example = """
        {
            "S": [1, 2],
            "A": [3, 4, 5],
            "B": [6],
            "C": [],
            "D": [],
            "UNASSIGNED": [7, 8]
        }
        """
    )
    private Map<String, List<Long>> photos; // 티어별 사진 ID 리스트
}
