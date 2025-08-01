package com.ssafy.keepick.controller.group.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupLinkResponse {
    private String link;

    public static GroupLinkResponse toResponse(String link) {
        return GroupLinkResponse
                .builder()
                .link(link)
                .build();
    }
}
