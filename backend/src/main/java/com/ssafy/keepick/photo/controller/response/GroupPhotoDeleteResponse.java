package com.ssafy.keepick.photo.controller.response;

import com.ssafy.keepick.photo.application.dto.GroupPhotoDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoDeleteResponse {

    @Schema(description = "삭제된 사진 ID 목록", example = "[101, 102]")
    private List<Long> deletedPhotoIds;

    @Schema(description = "삭제되지 않은 사진 ID 목록", example = "[103]")
    private List<Long> unDeletedPhotoIds;

    public static GroupPhotoDeleteResponse from(List<Long> photoIds, List<GroupPhotoDto> deletedPhotoDots) {
        List<Long> deletedPhotoIds = deletedPhotoDots.stream()
                .map(GroupPhotoDto::getPhotoId)
                .toList();

        List<Long> unDeletedPhotoIds = photoIds.stream()
                .filter(id -> !deletedPhotoIds.contains(id))
                .toList();

        return GroupPhotoDeleteResponse.builder()
                .deletedPhotoIds(deletedPhotoIds)
                .unDeletedPhotoIds(unDeletedPhotoIds)
                .build();
    }
}
