package com.ssafy.keepick.controller.group.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupUpdateRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @NotBlank
    private String thumbnailUrl;
}
