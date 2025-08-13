package com.ssafy.keepick.photo.controller.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.keepick.photo.application.dto.GroupPhotoUploadDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUploadResponse {
    @Schema(description = "presigned url, not null")
    private String presignedUrl;
    @Schema(description = "저장될 사진의 id를 미리 알려줘서 이미지 분석 요청을 할 수 있도록 한다. not null")
    private Long imageId;

    public static GroupPhotoUploadResponse from(GroupPhotoUploadDto dto) {
        return GroupPhotoUploadResponse.builder()
                .imageId(dto.getPhotoId())
                .presignedUrl(dto.getPresignedUrl())
                .build();
    }

    public static GroupPhotoUploadResponse of(String presignedUrl, Long imageId) {
        return GroupPhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .imageId(imageId)
                .build();
    }

    public static GroupPhotoUploadResponse of(String presignedUrl) {
        return GroupPhotoUploadResponse.builder()
                .presignedUrl(presignedUrl)
                .imageId(parseImageId(presignedUrl))
                .build();
    }

    private static Long parseImageId(String url) {
        Pattern pattern = Pattern.compile("originals/(\\d+)");
        Matcher matcher = pattern.matcher(url);

        if (matcher.find()) {
            String groupId = matcher.group(1);
            return Long.parseLong(groupId);
        } else {
            return null;
        }
    }
}

