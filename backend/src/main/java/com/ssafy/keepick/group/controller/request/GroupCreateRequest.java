package com.ssafy.keepick.group.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupCreateRequest {
    @NotBlank
    private String name;
}
