package com.ssafy.keepick.group.controller.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupLinkResponse {

    @Schema(description = "그룹 초대 링크(URL)", example = " https://i13d207.p.ssafy.io/invite/abc123")
    private String link;

    public static GroupLinkResponse toResponse(String link) {
        return GroupLinkResponse
                .builder()
                .link(link)
                .build();
    }
}
