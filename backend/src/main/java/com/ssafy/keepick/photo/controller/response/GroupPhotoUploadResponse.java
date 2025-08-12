package com.ssafy.keepick.photo.controller.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Getter
@Builder
@AllArgsConstructor
public class GroupPhotoUploadResponse {
    private String presignedUrl;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long imageId;

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

