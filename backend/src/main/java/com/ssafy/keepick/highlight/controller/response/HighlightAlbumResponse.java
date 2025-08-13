package com.ssafy.keepick.highlight.controller.response;

import com.ssafy.keepick.highlight.application.dto.HighlightAlbumDto;
import com.ssafy.keepick.highlight.application.dto.HighlightAlbumPhotoDto;
import com.ssafy.keepick.highlight.domain.HighlightType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Builder
@AllArgsConstructor
public class HighlightAlbumResponse {

    @Schema(description = "하이라이트 앨범 ID", example = "101")
    private Long albumId;

    @Schema(description = "그룹 ID", example = "101")
    private Long groupId;

    @Schema(description = "하이라이트 앨범 이름 (초기 이름은 앨범 생성 시각을 문자로 변환한 값입니다.)", example = "2025.08.01 그룹챗 하이라이트")
    private String name;
    
    @Schema(description = "하이라이트 앨범 설명", example = "제주도 여행 앨범 만들면서 진행한 그룹챗의 앨범", nullable = true)
    private String description;

    @Schema(description = "하이라이트 앨범에 포함된 사진 개수", example = "4")
    private int photoCount;

    @Schema(description = "하이라이트 타입별 사진 목록")
    private Map<HighlightType, List<HighlightScreenshotSaveResponse>> photos;

    public static HighlightAlbumResponse from(HighlightAlbumDto album) {
        return HighlightAlbumResponse.builder()
                .albumId(album.getAlbumId())
                .groupId(album.getGroupId())
                .name(album.getName())
                .description(album.getDescription())
                .photoCount(album.getPhotoCount())
                .photos(groupingByType(album.getPhotos()))
                .build();
    }

    private static Map<HighlightType, List<HighlightScreenshotSaveResponse>> groupingByType(Map<HighlightType, List<HighlightAlbumPhotoDto>> photoList) {
        return photoList.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> entry.getValue().stream()
                            .map(HighlightScreenshotSaveResponse::from)
                            .collect(Collectors.toList())
                ));
    }
}
